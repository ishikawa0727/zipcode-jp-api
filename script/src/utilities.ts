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
export const uniqueObjectArray = (array: string[][]): string[][] => {
  const map = new Map();
  for(let index = 0; index < array.length; index += 1) {
    map.set(JSON.stringify(array[index]), array[index])
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
      throw new Error(`Index ${index} is out of bounds for array with length ${array.length}`)
    }
  })
  return values;
}