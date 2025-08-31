import { CSV_HEADER_FIELDS } from "./const"

export type ZipCodeData = Record<typeof CSV_HEADER_FIELDS[number], string>

/**
 * 郵便番号の上3桁をキーとしたオブジェクトに変換する
 */
export const segmentalizeByZipCodeUpperDigits = (rows: string[][]) :Record<string, string[][]> => {
  return rows.reduce((result, row) => {
      const upperDigits = row[CSV_HEADER_FIELDS.indexOf('zip_code')].slice(0, 3)
      result[upperDigits] = result[upperDigits] || []
      result[upperDigits].push(row)
      return result
  },{})
}

