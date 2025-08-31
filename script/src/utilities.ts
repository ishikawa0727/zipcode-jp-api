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

