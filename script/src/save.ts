import fs from 'fs-extra'
import path from 'path'
import { stringify as csvStringify } from 'csv-stringify/sync';
import { CSV_HEADER_FIELDS } from './const'

type ZipCodeData = Record<typeof CSV_HEADER_FIELDS[number], string>

const SAVE_DIRECTORY = path.join(__dirname, '../../../data/')

/**
 * データをファイルに保存する
 */
export const save = (indexedZipCodeCsvLines: {[zipCode: string]: string[][]}) => {
  const dirs = ['full-json', 'full-jsonp', 'full-csv', 'min-json', 'min-jsonp', 'min-csv'];
  dirs.map(dir => fs.removeSync(path.join(SAVE_DIRECTORY, dir)))
  dirs.map(dir => fs.mkdirSync(path.join(SAVE_DIRECTORY, dir), {recursive: true}))
  Object.entries(indexedZipCodeCsvLines).forEach(([key, csvLines]) => {

    const zipCodeDataList = csvLinesToZipCodeDataList(csvLines)
    fs.writeFileSync(path.join(SAVE_DIRECTORY, `full-json/${key}.json`), JSON.stringify(zipCodeDataList))
    fs.writeFileSync(path.join(SAVE_DIRECTORY, `full-jsonp/${key}.js`), `$$zipcodejp(${JSON.stringify(zipCodeDataList)});`)
    fs.writeFileSync(path.join(SAVE_DIRECTORY, `full-csv/${key}.csv`), csvStringify(csvLines))

    const minimizedCsv = zipCodeDataList.map(zipCodeDataToMinimizedCsv)
    fs.writeFileSync(path.join(SAVE_DIRECTORY, `min-json/${key}.json`), JSON.stringify(minimizedCsv))
    fs.writeFileSync(path.join(SAVE_DIRECTORY, `min-jsonp/${key}.js`), `$$zipcodejp(${JSON.stringify(minimizedCsv)});`)
    fs.writeFileSync(path.join(SAVE_DIRECTORY, `min-csv/${key}.csv`), csvStringify(minimizedCsv))
  })
}

/**
 * 圧縮版データを作成
 * 郵便番号と都道府県、市区町村、町域を抜き出す
 * 町域が「以下に掲載がない場合」の時は空配列にする
 * 町域の「（...）」の部分を削除する
 */
const zipCodeDataToMinimizedCsv = (data: ZipCodeData) => {
  return [
    data.zip_code,
    data.prefecture,
    data.city,
    data.town === '以下に掲載がない場合' ? '' : data.town.split('（')[0]
  ]
}

/**
 * 配列をzipCodeDataの形式に変換する
 */
const csvLinesToZipCodeDataList = (csvLines: string[][]) => {
  return csvLines.map(csvLine => csvLine.reduce((acc, value, index) => {
    CSV_HEADER_FIELDS[index] && (acc[CSV_HEADER_FIELDS[index]] = value)
    return acc
  }, {} as ZipCodeData))
}