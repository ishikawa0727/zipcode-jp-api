import fs from 'fs-extra'
import path from 'path'
import { stringify as csvStringify } from 'csv-stringify/sync';

import { CSV_HEADER_FIELDS } from './const'

export type ZipCodeData = Record<typeof CSV_HEADER_FIELDS[number], string>

/**
 * データをファイルに保存する
 */
export const save = (segmentalized: Record<string, string[][]>) => {
  const dirs = ['../../data/full-json', '../../data/full-jsonp', '../../data/full-csv', '../../data/min-json', '../../data/min-jsonp', '../../data/min-csv'];
  dirs.map(dir => fs.removeSync(path.join(__dirname, dir)))
  dirs.map(dir => fs.mkdirSync(path.join(__dirname, dir), {recursive: true}))
  Object.entries(segmentalized).forEach(([key, rows]) => {
    const zipCodeDataList = rowsToZipCodeDataList(rows)
    const minimized = zipCodeDataList.map(minimize)
    fs.writeFileSync(path.join(__dirname, `../../data/full-json/${key}.json`), JSON.stringify(zipCodeDataList))
    fs.writeFileSync(path.join(__dirname, `../../data/full-jsonp/${key}.js`), `$$zipcodejp(${JSON.stringify(zipCodeDataList)});`)
    fs.writeFileSync(path.join(__dirname, `../../data/full-csv/${key}.csv`), csvStringify(rows))
    fs.writeFileSync(path.join(__dirname, `../../data/min-json/${key}.json`), JSON.stringify(minimized))
    fs.writeFileSync(path.join(__dirname, `../../data/min-jsonp/${key}.js`), `$$zipcodejp(${JSON.stringify(minimized)});`)
    fs.writeFileSync(path.join(__dirname, `../../data/min-csv/${key}.csv`), csvStringify(minimized))
  })
}

/**
 * 郵便番号と都道府県、市区町村、町域を抜き出す
 * 町域が「以下に掲載がない場合」の時は空配列にする
 * 町域の「（...）」の部分を削除する
 */
const minimize = (data: ZipCodeData) => {
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
const rowsToZipCodeDataList = (rows: string[][]) => {
  return rows.map(values => values.reduce((zipCodeData, value, index) => {
    CSV_HEADER_FIELDS[index] && (zipCodeData[CSV_HEADER_FIELDS[index]] = value)
    return zipCodeData
  }, {} as ZipCodeData))
}