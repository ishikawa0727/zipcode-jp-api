import { CSV_HEADER_FIELDS } from './const'
import { extractIndexesByValues, extractValuesByIndexes } from './utilities'
type TownNameData = {
  zipCode: string
  townList: string[]
  townKanaList: string[]
}

/**
 * 町域名（town）を補正する
 * ※ 元のCSVデータの「町域名」欄に「1つの町域名」が、複数行に分割されて記載されている箇所があるため、補正を行う
 * ex) 〒0210102の場合
 * [before] 1つの町域名が4行に分割されている
 *   n行目の町域名：萩荘（赤猪子、芦ノ口、甘蕨、老流、大沢、上宇津野、上本郷、上要害、化粧
 * n+1行目の町域名：坂、三月田、下宇津野、下本郷、外山、堂の沢、栃倉、栃倉南、長倉、中沢、
 * n+2行目の町域名：八森、馬場、広面、平場、古釜場、曲淵、松原、南沢、谷起、焼切、八瀬、
 * n+3行目の町域名：岩手県,一関市,八幡、山ノ沢）
 * [after] 4行に同じ「結合された町域名」が割り当てられるように修正する
 *   n行目の町域名：萩荘（赤猪子、芦ノ口、甘蕨、老流、大沢、上宇津野、上本郷、上要害、化粧坂、三月田、下宇津野、下本郷、外山、堂の沢、栃倉、栃倉南、長倉、中沢、八森、馬場、広面、平場、古釜場、曲淵、松原、南沢、谷起、焼切、八瀬、岩手県,一関市,八幡、山ノ沢）
 * n+1行目の町域名：萩荘（赤猪子、芦ノ口、甘蕨、老流、大沢、上宇津野、上本郷、上要害、化粧坂、三月田、下宇津野、下本郷、外山、堂の沢、栃倉、栃倉南、長倉、中沢、八森、馬場、広面、平場、古釜場、曲淵、松原、南沢、谷起、焼切、八瀬、岩手県,一関市,八幡、山ノ沢）
 * n+2行目の町域名：萩荘（赤猪子、芦ノ口、甘蕨、老流、大沢、上宇津野、上本郷、上要害、化粧坂、三月田、下宇津野、下本郷、外山、堂の沢、栃倉、栃倉南、長倉、中沢、八森、馬場、広面、平場、古釜場、曲淵、松原、南沢、谷起、焼切、八瀬、岩手県,一関市,八幡、山ノ沢）
 * n+3行目の町域名：萩荘（赤猪子、芦ノ口、甘蕨、老流、大沢、上宇津野、上本郷、上要害、化粧坂、三月田、下宇津野、下本郷、外山、堂の沢、栃倉、栃倉南、長倉、中沢、八森、馬場、広面、平場、古釜場、曲淵、松原、南沢、谷起、焼切、八瀬、岩手県,一関市,八幡、山ノ沢）
 */
export const normalizeTownNames = (rows: string[][]) => {
  const copiedRows: string[][] = JSON.parse(JSON.stringify(rows))
  const conditionsIndexedByZipCode = createZipCodeToNormalizedTownNameDataMap(copiedRows)
  const zipCodeIndex = CSV_HEADER_FIELDS.indexOf('zip_code')
  const townIndex = CSV_HEADER_FIELDS.indexOf('town')
  const townKanaIndex = CSV_HEADER_FIELDS.indexOf('town_kana')
  for(let i = 0; i < copiedRows.length; i += 1) {
    const row = copiedRows[i]
    const result = getFixedTown(row[zipCodeIndex], row[townIndex], conditionsIndexedByZipCode)
    if(result) {
      row[townIndex] = result.fixedTown
      row[townKanaIndex] = result.fixedTownKana
    }
  }
  return copiedRows
}

/**
 * 町域名が複数行に分割されているデータを補正し、郵便番号をキーとし、町域名データを値としたオブジェクトを返す
 */
const createZipCodeToNormalizedTownNameDataMap = (zipCodeCsvLines: string[][]) => {
  // 各フィールドのカラムインデックスを取得
  const [zipCodeIndex, townIndex, townKanaIndex] = extractIndexesByValues([...CSV_HEADER_FIELDS], ['zip_code', 'town', 'town_kana'])

  const normalizedTownNameDataList: TownNameData[] = [] // 
  let isStartParenthesis = false
  
  for(let i = 0; i < zipCodeCsvLines.length; i += 1) {
    // CSVの各行から必要なセルデータを抜き出す
    const [zipCode, town, townKana] = extractValuesByIndexes(zipCodeCsvLines[i], [zipCodeIndex, townIndex, townKanaIndex])
    if(/（/.test(town)) { // 開き括弧を含む場合
      isStartParenthesis = true
      normalizedTownNameDataList.push({
        zipCode,
        townList: [],
        townKanaList: [],
      })
    }
    if(isStartParenthesis) {
      const condition = normalizedTownNameDataList.at(-1)
      if(condition?.zipCode === zipCode) {
        condition.townList.push(town)
        condition.townKanaList.push(townKana)
      } else {
        throw new Error(`${zipCode} is not ${condition?.zipCode}.`)
      }
    }
    if(/）/.test(town)) { // 閉じ括弧を含む場合
      isStartParenthesis = false
    }
  }
  return normalizedTownNameDataList
    .filter(condition => condition.townList.length > 1)
    .reduce((result, condition) => {
      result[condition.zipCode] = result[condition.zipCode] || []
      result[condition.zipCode].push(condition)
      return result
    }, {})
}

/**
 * 補正条件から補正された町域を作成して返す
 * 補正する必要がない場合、undefinedを返す
 */
const getFixedTown = (
  zipCode: string,
  town: string,
  conditionsIndexedByZipCode: Record<string, TownNameData[]>
): {fixedTown: string, fixedTownKana: string} | undefined => {
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