import fs from 'fs-extra'
import path from 'path'
import { stringify as csvStringify } from 'csv-stringify/sync';
import { CSV_HEADER_FIELDS, REGEX_PATTERNS } from './const'

type ZipCodeData = Record<typeof CSV_HEADER_FIELDS[number], string>

const SAVE_DIRECTORY = path.join(__dirname, '../../../data/')
const SPECIAL_TOWN_VALUES = {
  NO_DETAILS: '以下に掲載がない場合'
} as const
/**
 * データをファイルに保存する
 */
export const save = (indexedZipCodeCsvLines: {[zipCode: string]: string[][]}) => {
  const DIR_NAME = {
    FULL_JSON: 'full-json',
    FULL_JSONP: 'full-jsonp',
    FULL_CSV: 'full-csv',
    MIN_JSON: 'min-json',
    MIN_JSONP: 'min-jsonp',
    MIN_CSV: 'min-csv',
  } as const
  const DIR_NAMES = Object.values(DIR_NAME)
  DIR_NAMES.map(dir => fs.removeSync(path.join(SAVE_DIRECTORY, dir)))
  DIR_NAMES.map(dir => fs.mkdirSync(path.join(SAVE_DIRECTORY, dir), {recursive: true}))
  Object.entries(indexedZipCodeCsvLines).forEach(([key, csvLines]) => {

    const zipCodeDataList = csvLinesToZipCodeDataList(csvLines)
    fs.writeFileSync(path.join(SAVE_DIRECTORY, DIR_NAME.FULL_JSON, `${key}.json`), JSON.stringify(zipCodeDataList))
    fs.writeFileSync(path.join(SAVE_DIRECTORY, DIR_NAME.FULL_JSONP, `${key}.js`), `$$zipcodejp(${JSON.stringify(zipCodeDataList)});`)
    fs.writeFileSync(path.join(SAVE_DIRECTORY, DIR_NAME.FULL_CSV, `${key}.csv`), csvStringify(csvLines))

    const minimizedCsv = zipCodeDataList.map(createMinimizedCsvRow)
    fs.writeFileSync(path.join(SAVE_DIRECTORY, DIR_NAME.MIN_JSON, `${key}.json`), JSON.stringify(minimizedCsv))
    fs.writeFileSync(path.join(SAVE_DIRECTORY, DIR_NAME.MIN_JSONP, `${key}.js`), `$$zipcodejp(${JSON.stringify(minimizedCsv)});`)
    fs.writeFileSync(path.join(SAVE_DIRECTORY, DIR_NAME.MIN_CSV, `${key}.csv`), csvStringify(minimizedCsv))
  })
}

/**
 * 圧縮版データを作成
 * 郵便番号と都道府県、市区町村、町域を抜き出す
 * 町域が「以下に掲載がない場合」の時は空配列にする
 * 町域の「（...）」の部分を削除する
 */
const createMinimizedCsvRow = (data: ZipCodeData) => {
  return [
    data.zip_code,
    data.prefecture,
    data.city,
    data.town === SPECIAL_TOWN_VALUES.NO_DETAILS ? '' : data.town.split(REGEX_PATTERNS.OPEN_PARENTHESIS)[0]
  ]
}

/**
 * 配列をzipCodeDataの形式に変換する
 */
const csvLinesToZipCodeDataList = (csvLines: string[][]) => {
  return csvLines.map(csvLine => csvLine.reduce((zipCodeData, currentValue, currentIndex) => {
    if(CSV_HEADER_FIELDS[currentIndex]) {
      zipCodeData[CSV_HEADER_FIELDS[currentIndex]] = currentValue
    }
    return zipCodeData
  }, {} as ZipCodeData))
}