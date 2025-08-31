import { CSV_HEADER_FIELDS } from './const'
type FixTownCondition = {
  zipCode: string
  townList: string[]
  townKanaList: string[]
}
type ZipCodeData = Record<typeof CSV_HEADER_FIELDS[number], string>


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
export const fixTown = (rows: string[][]) => {
  const copiedRows: string[][] = JSON.parse(JSON.stringify(rows))
  const conditionsIndexedByZipCode = makeFixTownConditionsIndexedByZipCode(copiedRows)
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
 * 補正条件から補正された町域を作成して返す
 * 補正する必要がない場合、undefinedを返す
 */
const getFixedTown = (
  zipCode: string,
  town: string,
  conditionsIndexedByZipCode: Record<string, FixTownCondition[]>
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

/**
 * 配列をzipCodeDataの形式に変換する
 */
const rowsToZipCodeDataList = (rows: string[][]) => {
  return rows.map(values => values.reduce((zipCodeData, value, index) => {
    CSV_HEADER_FIELDS[index] && (zipCodeData[CSV_HEADER_FIELDS[index]] = value)
    return zipCodeData
  }, {} as ZipCodeData))
}