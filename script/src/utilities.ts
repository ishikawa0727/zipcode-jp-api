import https from 'https'
import encodingJapanese from 'encoding-japanese'

/**
 * 指定されたURLから取得したデータをBufferとして返す
 */
export const httpRequest = (url: string): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    https.request(url, (res) => {
      const data: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        data.push(chunk)
      }).on('close', () =>{
        resolve(Buffer.concat(data))
      }).on('error', reject)
    }).end()
  })
}

/**
 * 文字コードをShift-JISからunicodeに変換する
 */
export const encodeFromSJIS = (buffer: Buffer) => {
  return encodingJapanese.convert(buffer, {
    from: 'SJIS',
    to: 'UNICODE',
    type: 'string',
  });
}

/**
 * オブジェクトまたは配列を要素に持つ配列からデータの重複を排除する
 */
export const uniqueObjectRows = (rows: string[][]): string[][] => {
  const map = new Map();
  for(let i = 0; i < rows.length; i += 1) {
    map.set(JSON.stringify(rows[i]), rows[i])
  }
  return [...map.values()]
}

/**
 * 配列から指定したindexの値を抜き取る
 */
export const extractValuesByIndexes = <T>(array: T[], indexes: number[]): T[] => {
  const values: T[] = []
  indexes.forEach((index) => {
    if(array[index]) {
      values.push(array[index])
    } else {
      throw new Error(`The Given index "${index}" is not exit in the provided array.`)
    }
  })
  return values;
}

/**
 * 配列から指定した値のindexを抜き取る
 */
export const extractIndexesByValues = <T>(array: T[], values: T[]): number[] => {
  const indexes: number[] = []
  values.forEach((value) => {
    if(array.indexOf(value)) {
      indexes.push(array.indexOf(value))
    } else {
      throw new Error(`The Given value "${value}" is not exit in the provided array.`)
    }
  })
  return indexes;
}
