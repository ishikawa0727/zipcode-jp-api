/*
 * 日本郵政が提供している郵便番号データ（CSV形式）のカラムインデックスとフィールド名を関連づけるためのデータ
 * [各項目の詳細]{@link https://www.post.japanpost.jp/zipcode/dl/readme.html}
 */
export const CSV_HEADER_FIELDS = [
  'code', // 1.全国地方公共団体コード（JIS X0401、X0402）………　半角数字
  'old_zip_code', //2.（旧）郵便番号（5桁）………………………………………　半角数字
  'zip_code', // 3.郵便番号（7桁）………………………………………　半角数字
  'prefecture_kana', // 4.都道府県名　…………　半角カタカナ（コード順に掲載）　（注1）
  'city_kana', // 5.市区町村名　…………　半角カタカナ（コード順に掲載）　（注1）
  'town_kana', // 6.町域名　………………　半角カタカナ（五十音順に掲載）　（注1）
  'prefecture', // 7.都道府県名　…………　漢字（コード順に掲載）　（注1,2）
  'city', // 8.市区町村名　…………　漢字（コード順に掲載）　（注1,2）
  'town', // 9.町域名　………………　漢字（五十音順に掲載）　（注1,2）
  'has_multiple_zip_codes', // 10.一町域が二以上の郵便番号で表される場合の表示　（注3）　（「1」は該当、「0」は該当せず）
  'needs_koaza', // 11.小字毎に番地が起番されている町域の表示　（注4）　（「1」は該当、「0」は該当せず）
  'has_chome', // 12.丁目を有する町域の場合の表示　（「1」は該当、「0」は該当せず）
  'shares_zip_code', // 12.一つの郵便番号で二以上の町域を表す場合の表示　（注5）　（「1」は該当、「0」は該当せず）
  'update_status', // 13.更新の表示（注6）（「0」は変更なし、「1」は変更あり、「2」廃止（廃止データのみ使用））
  'change_reason', // 14.変更理由　（「0」は変更なし、「1」市政・区政・町政・分区・政令指定都市施行、「2」住居表示の実施、「3」区画整理、「4」郵便区調整等、「5」訂正、「6」廃止（廃止データのみ使用））
] as const

export const FIELD_INDEXES = {
  ZIP_CODE: CSV_HEADER_FIELDS.indexOf('zip_code'),
  TOWN: CSV_HEADER_FIELDS.indexOf('town'),
  TOWN_KANA: CSV_HEADER_FIELDS.indexOf('town_kana')
} as const

export const REGEX_PATTERNS = {
  OPEN_PARENTHESIS: /（/,
  CLOSE_PARENTHESIS: /）/
} as const

