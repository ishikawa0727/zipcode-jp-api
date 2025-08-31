
import decompress from 'decompress'
import { parse as csvParse } from 'csv-parse/sync';
import { httpRequest, encodeFromSJIS, uniqueObjectRows } from './src/utilities'
import { fixTown } from './src/fixTown'
import { segmentalizeByZipCodeUpperDigits } from './src/segmentalizeByZipCodeUpperDigits'
import { save } from './src/save';

(async() => {
  const response = await httpRequest('https://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip')
  const decompressed = await decompress(response)
  const encoded = encodeFromSJIS(decompressed[0].data)
  const rows: string[][] = csvParse(encoded)
  const fixedRows = fixTown(rows)
  const uniqRows = uniqueObjectRows(fixedRows)
  const segmentalized = segmentalizeByZipCodeUpperDigits(uniqRows)
  save(segmentalized)
})()









