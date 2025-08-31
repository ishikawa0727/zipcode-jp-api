
import decompress from 'decompress'
import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';
import { CSV_HEADER_FIELDS } from './src/const'
import { httpRequest, encodeFromSJIS, uniqueObjectRows } from './src/utilities'
import { normalizeTownNames } from './src/normalizeTownNames'
import { ZipCodeJp } from './src/ZipCodeJp';


type ZipCodeData = Record<typeof CSV_HEADER_FIELDS[number], string>

type FixTownCondition = {
  zipCode: string
  townList: string[]
  townKanaList: string[]
}

async function main() {
  const response = await httpRequest('https://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip')
  const decompressed = await decompress(response)
  const encoded = encodeFromSJIS(decompressed[0].data)
  const rows: string[][] = csvParse(encoded)
  const fixedRows = ZipCodeJp.fixTown(rows)
  const uniqRows = uniqueObjectRows(fixedRows)
  const segmentalized = ZipCodeJp.segmentalizeByZipCodeUpperDigits(uniqRows)
  ZipCodeJp.save(segmentalized)
}

main()







