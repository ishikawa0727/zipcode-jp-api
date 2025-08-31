import { CSV_HEADER_FIELDS } from "./const"

export type ZipCodeData = Record<typeof CSV_HEADER_FIELDS[number], string>

/**
 * 郵便番号CSVデータを、郵便番号の上3桁をキーとしたオブジェクトに変換する
 */
export const indexByZipCodePrefix = (zipCodeCsvLines: string[][]) : {[zipCodePrefix: string]: string[][]} => {
  return zipCodeCsvLines.reduce((acc, zipCodeCsvLine) => {
    const zipCode = zipCodeCsvLine[CSV_HEADER_FIELDS.indexOf('zip_code')]
      const zipCodePrefix = zipCode.slice(0, 3) // 郵便番号の上３桁
      acc[zipCodePrefix] ??= []
      acc[zipCodePrefix].push(zipCodeCsvLine)
      return acc
  },{})
}

