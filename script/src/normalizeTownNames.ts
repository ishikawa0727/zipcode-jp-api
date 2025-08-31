import { FIELD_INDEXES, REGEX_PATTERNS } from './const'
import { extractValuesByIndexes } from './utilities'
import { ZipCodeProcessingError } from './error'

type MultiLineTownData = {
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
export const normalizeTownNames = (zipCodeCsvLines: string[][]) => {
  const mutableCsvLines: string[][] = JSON.parse(JSON.stringify(zipCodeCsvLines))
  // 変換が必要な町域名のデータを抜き出す
  const multiLineTownDataList = createMultiLineTownDataList(mutableCsvLines)
  // zipCodeで索引できるように変換
  const zipCodeToMultiLineTownDataMap = multiLineTownDataList.reduce((zipCodeToMultiLineTownData, currentMultiLineTownData) => {
    zipCodeToMultiLineTownData[currentMultiLineTownData.zipCode] = currentMultiLineTownData
    return zipCodeToMultiLineTownData
  }, {} as {[zipCode: string]: MultiLineTownData});

  // 各CSVの行に対して、町域名の補正データがある場合は、町域名を差し替える
  for(let lineIndex = 0; lineIndex < mutableCsvLines.length; lineIndex += 1) {
    const csvLine = mutableCsvLines[lineIndex]
    const zipCode = csvLine[FIELD_INDEXES.ZIP_CODE]
    const multiLineTownData = zipCodeToMultiLineTownDataMap[zipCode]
    if(!multiLineTownData?.townList.includes(csvLine[FIELD_INDEXES.TOWN])) {
      continue
    }
    csvLine[FIELD_INDEXES.TOWN] = multiLineTownData.townList.join('')
    csvLine[FIELD_INDEXES.TOWN_KANA] = multiLineTownData.townKanaList.join('')
  }
  return mutableCsvLines
}

/**
 * 町域名が複数行に分割されているデータを補正し、町域名データのリストを返す
 * ※補正が必要なデータのみを返す
 */
const createMultiLineTownDataList = (zipCodeCsvLines: string[][]): MultiLineTownData[] => {

  const multiLineTownDataList: MultiLineTownData[] = []
  let isProcessingMultiLineTown = false
  
  for(let lineIndex = 0; lineIndex < zipCodeCsvLines.length; lineIndex += 1) {
    // CSVの各行から必要なセルデータを抜き出す
    const [currentZipCode, currentTown, currentTownKana] = extractValuesByIndexes(zipCodeCsvLines[lineIndex], [FIELD_INDEXES.ZIP_CODE, FIELD_INDEXES.TOWN, FIELD_INDEXES.TOWN_KANA])
    if(REGEX_PATTERNS.OPEN_PARENTHESIS.test(currentTown) && !REGEX_PATTERNS.CLOSE_PARENTHESIS.test(currentTown)) { // 開き括弧のみを含む場合
      isProcessingMultiLineTown = true
      multiLineTownDataList.push({
        zipCode: currentZipCode,
        townList: [],
        townKanaList: [],
      })
    }
    if(isProcessingMultiLineTown) {
      const currentMultiLineTownData = multiLineTownDataList.at(-1)
      if(currentMultiLineTownData?.zipCode === currentZipCode) {
        currentMultiLineTownData.townList.push(currentTown)
        currentMultiLineTownData.townKanaList.push(currentTownKana)
      } else {
        throw new ZipCodeProcessingError(
          `Zip code mismatch: expected ${currentZipCode}, but found ${currentMultiLineTownData?.zipCode}`,
          'ZIP_CODE_MISMATCH'
        )
      }
    }
    if(REGEX_PATTERNS.CLOSE_PARENTHESIS.test(currentTown)) { // 閉じ括弧を含む場合
      isProcessingMultiLineTown = false
    }
  }
  return multiLineTownDataList
}