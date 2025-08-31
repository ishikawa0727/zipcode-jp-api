import fs from 'fs-extra'
import path from 'path'
import { stringify as csvStringify } from 'csv-stringify/sync';
import { CSV_HEADER_FIELDS, REGEX_PATTERNS, ERROR_CODE } from './const'
import { ZipCodeProcessingError } from './error';

type ZipCodeData = Record<typeof CSV_HEADER_FIELDS[number], string>

const SAVE_DIRECTORY = path.join(__dirname, '../../../data/')
const DIR_NAME = {
  FULL_JSON: 'full-json',
  FULL_JSONP: 'full-jsonp',
  FULL_CSV: 'full-csv',
  MIN_JSON: 'min-json',
  MIN_JSONP: 'min-jsonp',
  MIN_CSV: 'min-csv',
} as const
const DIR_NAMES = Object.values(DIR_NAME)
const SPECIAL_TOWN_VALUES = {
  NO_DETAILS: '以下に掲載がない場合'
} as const

/**
 * データをファイルに保存する
 * @param indexedZipCodeCsvLines 郵便番号でインデックス化されたCSVデータ
 * @returns Promise<void> 保存処理の完了
 */
export const saveNewFiles = async (indexedZipCodeCsvLines: {[zipCode: string]: string[][]}) => {
  try {
    const promises = Object.entries(indexedZipCodeCsvLines).flatMap(([key, csvLines]) => {
      const zipCodeDataList = csvLinesToZipCodeDataList(csvLines)
      const minimizedCsv = zipCodeDataList.map(createMinimizedCsvRow)
      return [
        fs.writeFile(path.join(SAVE_DIRECTORY, DIR_NAME.FULL_JSON, `${key}.json`), JSON.stringify(zipCodeDataList)),
        fs.writeFile(path.join(SAVE_DIRECTORY, DIR_NAME.FULL_JSONP, `${key}.js`), `$$zipcodejp(${JSON.stringify(zipCodeDataList)});`),
        fs.writeFile(path.join(SAVE_DIRECTORY, DIR_NAME.FULL_CSV, `${key}.csv`), csvStringify(csvLines)),
        fs.writeFile(path.join(SAVE_DIRECTORY, DIR_NAME.MIN_JSON, `${key}.json`), JSON.stringify(minimizedCsv)),
        fs.writeFile(path.join(SAVE_DIRECTORY, DIR_NAME.MIN_JSONP, `${key}.js`), `$$zipcodejp(${JSON.stringify(minimizedCsv)});`),
        fs.writeFile(path.join(SAVE_DIRECTORY, DIR_NAME.MIN_CSV, `${key}.csv`), csvStringify(minimizedCsv)),
      ]
    })
    return await Promise.all(promises)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new ZipCodeProcessingError(
      `Failed to save output files: ${errorMessage}. Please reset data files with "git checkout $ROOT_DIR/data"`,
      ERROR_CODE.ZIP_CODE_PROCESSING.FILE_SAVING_FAILED
    )
  }
}

/**
 * 古いファイルのあるディレクトリを削除する
 * @returns Promise<void> 削除処理の完了
 */
export const removeOldDirectories = async () => {
  try {
    return await Promise.all(
      DIR_NAMES.map(dir => fs.remove(path.join(SAVE_DIRECTORY, dir)))
    )
  } catch(error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new ZipCodeProcessingError(
      `Failed to remove output directory: ${errorMessage}. Please reset data files with "git checkout $ROOT_DIR/data"`,
      ERROR_CODE.ZIP_CODE_PROCESSING.DIRECTORY_REMOVING_FAILED
    )
  }
}

/**
 * 新しいファイルを保存するためのディレクトリを作成する
 * @returns Promise<void> 作成処理の完了
 */
export const makeNewDirectories = async () => {
  try {
    return Promise.all(
      DIR_NAMES.map(dir => fs.mkdir(path.join(SAVE_DIRECTORY, dir)))
    )
  } catch(error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new ZipCodeProcessingError(
      `Failed to make output directory: ${errorMessage}. Please reset data files with "git checkout $ROOT_DIR/data"`,
      ERROR_CODE.ZIP_CODE_PROCESSING.DIRECTORY_MAKING_FAILED
    )
  }
}

/**
 * 圧縮版データを作成
 * 郵便番号と都道府県、市区町村、町域を抜き出す
 * 町域が「以下に掲載がない場合」の時は空配列にする
 * 町域の「（...）」の部分を削除する
 * @param zipCodeData 郵便番号データ
 * @return [striing, string, string, string] 必要最小限の郵便番号データ
 */
const createMinimizedCsvRow = (zipCodeData: ZipCodeData) => {
  return [
    zipCodeData.zip_code,
    zipCodeData.prefecture,
    zipCodeData.city,
    zipCodeData.town === SPECIAL_TOWN_VALUES.NO_DETAILS ? '' : zipCodeData.town.split(REGEX_PATTERNS.OPEN_PARENTHESIS)[0]
  ]
}

/**
 * 配列をzipCodeDataの形式に変換する
 * @param csvLines CSVデータ
 * @returns ZipCodeData[] オブジェクト形式の配列
 */
const csvLinesToZipCodeDataList = (csvLines: string[][]) => {
  return csvLines.map(csvLine => csvLine.reduce((zipCodeData, currentValue, currentIndex) => {
    if(CSV_HEADER_FIELDS[currentIndex]) {
      zipCodeData[CSV_HEADER_FIELDS[currentIndex]] = currentValue
    }
    return zipCodeData
  }, {} as ZipCodeData))
}