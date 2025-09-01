
import decompress from 'decompress'
import { parse as csvParse } from 'csv-parse/sync';
import { httpRequest, encodeFromSJIS, distinctNestedArrays } from '../src/utilities'
import { normalizeTownNames } from '../src/normalizeTownNames'
import { indexByZipCodePrefix } from '../src/indexByZipCodePrefix'
import { saveNewFiles, removeOldDirectories, makeNewDirectories } from '../src/output';
import { ZipCodeProcessingError } from '../src/error'

(async() => {
  try {
    const response = await httpRequest('https://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip')
    const decompressed = await decompress(response) // ZIPファイルを解凍
    const encoded = encodeFromSJIS(decompressed[0].data) // 文字コードをunicodeに変換
    const zipCodeCsvLines: string[][] = csvParse(encoded) // CSVパース
    const normalizedZipCodeCsvLines = normalizeTownNames(zipCodeCsvLines) // データ補正
    const uniqueZipCodeCsvLines = distinctNestedArrays(normalizedZipCodeCsvLines) // 重複削除
    const indexedZipCodeCsvLines = indexByZipCodePrefix(uniqueZipCodeCsvLines) // 郵便番号でindex化
    await removeOldDirectories() // 古いファイルを削除
    await makeNewDirectories() // 新しいファイルを保存するためのディレクトリを作成
    await saveNewFiles(indexedZipCodeCsvLines) // データをファイルに保存
  } catch(error) {
    if (error instanceof ZipCodeProcessingError) {
      console.error('Zip code processing error:', error.message)
      console.error('Error code:', error.code)
    } else {
      console.error('Unexpected error:', error)
    }
    process.exit(1)
  }
})()









