
import decompress from 'decompress'
import { parse as csvParse } from 'csv-parse/sync';
import { httpRequest, encodeFromSJIS, uniqueObjectArray } from './src/utilities'
import { normalizeTownNames } from './src/normalizeTownNames'
import { indexByZipCodePrefix } from './src/indexByZipCodePrefix'
import { save } from './src/save';

(async() => {
  const response = await httpRequest('https://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip')
  const decompressed = await decompress(response) // ZIPファイルを解凍
  const encoded = encodeFromSJIS(decompressed[0].data) // 文字コードをunicodeに変換
  const zipCodeCsvLines: string[][] = csvParse(encoded) // CSVパース
  const normalizedZipCodeCsvLines = normalizeTownNames(zipCodeCsvLines) // データ補正
  const uniqueZipCodeCsvLines = uniqueObjectArray(normalizedZipCodeCsvLines) // 重複削除
  const indexedZipCodeCsvLines = indexByZipCodePrefix(uniqueZipCodeCsvLines) // 郵便番号でindex化
  save(indexedZipCodeCsvLines) // ファイルに保存
})()









