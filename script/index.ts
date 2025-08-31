import https from 'https'
import fs from 'fs-extra'
import path from 'path'
import decompress from 'decompress'
import encodingJapanese from 'encoding-japanese'
import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';

(async({
  httpRequest,
  encodeFromSJIS,
  fixTown,
  uniqueRows,
  segmentalizeByZipCodeUpperDigits,
  save
}) => {
  const response = await httpRequest('https://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip')
  const decompressed = await decompress(response)
  const encoded = encodeFromSJIS(decompressed[0].data)
  const rows: string[][] = csvParse(encoded)
  const fixedRows = fixTown(rows)
  const uniqRows = uniqueRows(fixedRows)
  const segmentalized = segmentalizeByZipCodeUpperDigits(uniqRows)
  save(segmentalized)
})((() => {

  type ZipCodeData = Record<typeof KEYS[number], string>

  type FixTownCondition = {
    zipCode: string
    townList: string[]
    townKanaList: string[]
  }

  const KEYS = [
    // [各項目の詳細]{@link https://www.post.japanpost.jp/zipcode/dl/readme.html}
    'code', // 1.全国地方公共団体コード（JIS X0401、X0402）………　半角数字
    'old_zip_code', //2.（旧）郵便番号（5桁）………………………………………　半角数字
    'zip_code', // 3.郵便番号（7桁）………………………………………　半角数字
    'prefecture_kana', // 4.都道府県名　…………　半角カタカナ（コード順に掲載）　（注1）
    'city_kana', // 5.市区町村名　…………　半角カタカナ（コード順に掲載）　（注1）
    'town_kana', // 6.町域名　………………　半角カタカナ（五十音順に掲載）　（注1）
    'prefecture', // 7.都道府県名　…………　漢字（コード順に掲載）　（注1,2）
    'city', // 8.市区町村名　…………　漢字（コード順に掲載）　（注1,2）
    'town', // 9.町域名　………………　漢字（五十音順に掲載）　（注1,2）
    'has_multiple_zip_codes', // 10.一町域が二以上の郵便番号で表される場合の表示　（注3）　（「1」は該当、「0」は該当せず）
    'needs_koaza', // 11.小字毎に番地が起番されている町域の表示　（注4）　（「1」は該当、「0」は該当せず）
    'has_chome', // 12.丁目を有する町域の場合の表示　（「1」は該当、「0」は該当せず）
    'shares_zip_code', // 12.一つの郵便番号で二以上の町域を表す場合の表示　（注5）　（「1」は該当、「0」は該当せず）
    'update_status', // 13.更新の表示（注6）（「0」は変更なし、「1」は変更あり、「2」廃止（廃止データのみ使用））
    'change_reason', // 14.変更理由　（「0」は変更なし、「1」市政・区政・町政・分区・政令指定都市施行、「2」住居表示の実施、「3」区画整理、「4」郵便区調整等、「5」訂正、「6」廃止（廃止データのみ使用））
  ] as const
  
  /**
   * 配列をzipCodeDataの形式に変換する
   */
  const rowsToZipCodeDataList = (rows: string[][]) => {
    return rows.map(values => values.reduce((zipCodeData, value, index) => {
      KEYS[index] && (zipCodeData[KEYS[index]] = value)
      return zipCodeData
    }, {} as ZipCodeData))
  }
  
  /**
   * 郵便番号と都道府県、市区町村、町域を抜き出す
   * 町域が「以下に掲載がない場合」の時は空配列にする
   * 町域の「（...）」の部分を削除する
   */
  const minimize = (data: ZipCodeData) => [
    data.zip_code,
    data.prefecture,
    data.city,
    data.town === '以下に掲載がない場合' ? '' : data.town.split('（')[0]
  ]

  /**
   * 補正条件から補正された町域を作成して返す
   * 補正する必要がない場合、undefinedを返す
   */
  const getFixedTown = (zipCode: string, town: string, conditionsIndexedByZipCode: Record<string, FixTownCondition[]>) => {
    const conditions = conditionsIndexedByZipCode[zipCode]
    if(!conditions) {
      return undefined
    }
    const condition = conditions.find(x => x.townList.includes(town))
    if(!condition) {
      return undefined
    }
    return {
      fixedTown: condition.townList.join(''),
      fixedTownKana: condition.townKanaList.join('')
    }
  }
  
  /**
   * 町域名（town）を補正するための条件を作成する
   */
  const makeFixTownConditionsIndexedByZipCode = (rows: string[][]) => {
    const zipCodeDataList = rowsToZipCodeDataList(rows)
    let isStartParenthesis = false
    const fixTownConditionList: FixTownCondition[] = []
    for(let i = 0; i < zipCodeDataList.length; i += 1) {
      const { zip_code: zipCode, town, town_kana: townKana } = zipCodeDataList[i]
      if(/（/.test(town)) {
        isStartParenthesis = true
        fixTownConditionList.push({
          zipCode,
          townList: [],
          townKanaList: [],
        })
      }
      if(isStartParenthesis) {
        const condition = fixTownConditionList.slice(-1)[0]
        if(condition.zipCode === zipCode) {
          condition.townList.push(town)
          condition.townKanaList.push(townKana)
        } else {
          throw new Error(`${zipCode} is not ${condition.zipCode}.`)
        }
      }
      if(/）/.test(town)) {
        isStartParenthesis = false
      }
    }
    return fixTownConditionList
      .filter(condition => condition.townList.length > 1)
      .reduce((result, condition) => {
        result[condition.zipCode] = result[condition.zipCode] || []
        result[condition.zipCode].push(condition)
        return result
      }, {})
  }

  return {
    /**
     * 指定されたURLのデータを取得する
     */
    httpRequest: (url: string) => new Promise<Buffer>((resolve, reject) => {
      https.request(url, (res) => {
        const data: Buffer[] = [];
        res.on('data', (chunk: Buffer) => {
          data.push(chunk)
        }).on('close', () =>{
          resolve(Buffer.concat(data))
        }).on('error', reject)
      }).end()
    }),

    /**
     * 文字コードをShift-JISからunicodeに変換する
     */
    encodeFromSJIS: (buffer: Buffer) => {
      return encodingJapanese.convert(buffer, {
        from: 'SJIS',
        to: 'UNICODE',
        type: 'string',
      });
    },

    /**
     * 町域名（town）を補正する
     * ※ 元のCSVデータの「町域名」欄に複数行に跨いで記載されている箇所があるので、補正を行う
     * ex) 〒0210102の場合
     * [before]
     *   n行目の町域名：萩荘（赤猪子、芦ノ口、甘蕨、老流、大沢、上宇津野、上本郷、上要害、化粧
     * n+1行目の町域名：坂、三月田、下宇津野、下本郷、外山、堂の沢、栃倉、栃倉南、長倉、中沢、
     * n+2行目の町域名：八森、馬場、広面、平場、古釜場、曲淵、松原、南沢、谷起、焼切、八瀬、
     * n+3行目の町域名：岩手県,一関市,八幡、山ノ沢）
     * [after]
     *   n行目の町域名：萩荘（赤猪子、芦ノ口、甘蕨、老流、大沢、上宇津野、上本郷、上要害、化粧坂、三月田、下宇津野、下本郷、外山、堂の沢、栃倉、栃倉南、長倉、中沢、八森、馬場、広面、平場、古釜場、曲淵、松原、南沢、谷起、焼切、八瀬、岩手県,一関市,八幡、山ノ沢）
     * n+1行目の町域名：萩荘（赤猪子、芦ノ口、甘蕨、老流、大沢、上宇津野、上本郷、上要害、化粧坂、三月田、下宇津野、下本郷、外山、堂の沢、栃倉、栃倉南、長倉、中沢、八森、馬場、広面、平場、古釜場、曲淵、松原、南沢、谷起、焼切、八瀬、岩手県,一関市,八幡、山ノ沢）
     * n+2行目の町域名：萩荘（赤猪子、芦ノ口、甘蕨、老流、大沢、上宇津野、上本郷、上要害、化粧坂、三月田、下宇津野、下本郷、外山、堂の沢、栃倉、栃倉南、長倉、中沢、八森、馬場、広面、平場、古釜場、曲淵、松原、南沢、谷起、焼切、八瀬、岩手県,一関市,八幡、山ノ沢）
     * n+3行目の町域名：萩荘（赤猪子、芦ノ口、甘蕨、老流、大沢、上宇津野、上本郷、上要害、化粧坂、三月田、下宇津野、下本郷、外山、堂の沢、栃倉、栃倉南、長倉、中沢、八森、馬場、広面、平場、古釜場、曲淵、松原、南沢、谷起、焼切、八瀬、岩手県,一関市,八幡、山ノ沢）
     */
    fixTown: (rows: string[][]) => {
      const copiedRows: string[][] = JSON.parse(JSON.stringify(rows))
      const conditionsIndexedByZipCode = makeFixTownConditionsIndexedByZipCode(copiedRows)
      const zipCodeIndex = KEYS.indexOf('zip_code')
      const townIndex = KEYS.indexOf('town')
      const townKanaIndex = KEYS.indexOf('town_kana')
      for(let i = 0; i < copiedRows.length; i += 1) {
        const row = copiedRows[i]
        const result = getFixedTown(row[zipCodeIndex], row[townIndex], conditionsIndexedByZipCode)
        if(result) {
          row[townIndex] = result.fixedTown
          row[townKanaIndex] = result.fixedTownKana
        }
      }
      return copiedRows
    },

    /**
     * データの重複を排除する
     */
    uniqueRows: (rows: string[][]) => {
      const map = new Map();
      for(let i = 0; i < rows.length; i += 1) {
        map.set(JSON.stringify(rows[i]), rows[i])
      }
      return [...map.values()]
    },

    /**
     * 郵便番号の上3桁をキーとしたオブジェクトに変換する
     */
    segmentalizeByZipCodeUpperDigits: (rows: string[][]) :Record<string, string[][]> => rows.reduce((result, row) => {
        const upperDigits = row[KEYS.indexOf('zip_code')].slice(0, 3)
        result[upperDigits] = result[upperDigits] || []
        result[upperDigits].push(row)
        return result
    },{}),
  
    /**
     * データをファイルに保存する
     */
    save: (segmentalized: Record<string, string[][]>) => {
      const dirs = ['../data/full-json', '../data/full-jsonp', '../data/full-csv', '../data/min-json', '../data/min-jsonp', '../data/min-csv'];
      dirs.map(dir => fs.removeSync(path.join(__dirname, dir)))
      dirs.map(dir => fs.mkdirSync(path.join(__dirname, dir), {recursive: true}))
      Object.entries(segmentalized).forEach(([key, rows]) => {
        const zipCodeDataList = rowsToZipCodeDataList(rows)
        const minimized = zipCodeDataList.map(minimize)
        fs.writeFileSync(path.join(__dirname, `../data/full-json/${key}.json`), JSON.stringify(zipCodeDataList))
        fs.writeFileSync(path.join(__dirname, `../data/full-jsonp/${key}.js`), `$$zipcodejp(${JSON.stringify(zipCodeDataList)});`)
        fs.writeFileSync(path.join(__dirname, `../data/full-csv/${key}.csv`), csvStringify(rows))
        fs.writeFileSync(path.join(__dirname, `../data/min-json/${key}.json`), JSON.stringify(minimized))
        fs.writeFileSync(path.join(__dirname, `../data/min-jsonp/${key}.js`), `$$zipcodejp(${JSON.stringify(minimized)});`)
        fs.writeFileSync(path.join(__dirname, `../data/min-csv/${key}.csv`), csvStringify(minimized))
      })
    }
  }
})())







