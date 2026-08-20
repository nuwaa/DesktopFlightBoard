# Desktop Flight Board

*(日本語の説明は下部にあります / Japanese translation is available below)*

A beautiful, frameless desktop widget built with Electron that displays real-time airport departure and arrival information using the FlightRadar24 API (Application Programming Interface).

![Desktop Flight Board Screenshot](screenshot.png)

## Features
- **Premium UI:** Dark theme, frameless, and transparent background. Matches the aesthetics of modern airport information boards.
- **Real-time Data:** Fetches live flight data straight from FlightRadar24, with no runtime beyond Electron itself.
- **Departures and Arrivals:** Flip the board between the two from the settings menu. The header, the plane icon, and the time/endpoint column headings follow the mode.
- **Airline Logos:** Automatically displays official airline logos using Kiwi.com CDN (Content Delivery Network).
- **Multi-Airport Support:** Switch between 18 airports in Japan and Taiwan from the settings menu, grouped in the dropdown:
  - **Japan:** Haneda (HND), Narita (NRT)
  - **Taiwan (main island):** Taoyuan (TPE), Taipei Songshan (TSA), Taichung (RMQ), Chiayi (CYI), Tainan (TNN), Kaohsiung (KHH), Hualien (HUN), Taitung (TTT)
  - **Taiwan (outlying islands):** Magong/Penghu (MZG), Wangan (WOT), Qimei (CMJ), Kinmen (KNH), Matsu Nangan (LZN), Matsu Beigan (MFK), Green Island (GNI), Orchid Island (KYD)

  Note: FlightRadar24 carries no schedule data for the four smallest islands (WOT, CMJ, GNI, KYD), which are served only by Daily Air. Those airports show an empty board.
- **Japanese and Taiwanese Mandarin:** Pick the display language from the gear icon. Every label and all 324 city names exist in both, using Taiwan conventions (Sydney is 雪梨, not 悉尼) and the official 臺 spelling for Taiwanese place names. The English line on the board never changes, so it always reads as a bilingual airport display.
- **Scrollable:** Scroll through flights seamlessly when there are many departures.

## Prerequisites
- Node.js

## Installation

```bash
npm install
```

## Usage

Start the Electron application:
```bash
npm start
```

The window is frameless: drag anywhere on the board to move it, and click the **×** in the header (or press **Esc**) to quit. The gear icon opens the settings panel, where the display language is chosen; the choice is remembered across restarts.

All times are the **local time at the airport being shown**, not the time on your machine -- a Taipei board reads an hour behind a Tokyo one, as it does at the airport itself.

On the arrivals board, `Terminal` and `Gate` are the ones at the airport you are viewing. How completely FlightRadar24 fills them in varies a lot by airport -- Taoyuan reports an arrival gate for nearly every flight, Haneda for almost none.

## How to Customize
- **Add more airports:** Add an `<option>` to `index.html`, its country to `airportCountries` in `renderer.js` (which drives the domestic/international filter), and a label to `uiText.<lang>.airports` for each language.
- **Add city translations:** Add an entry to `cityNames` in `renderer.js`. Each one carries every language, so a city cannot be translated in one and forgotten in another.
- **Change update frequency:** Modify the `setInterval` in `renderer.js` (default is 600,000ms / 10 minutes).

## Note
This project reads FlightRadar24's unofficial endpoint for educational purposes. Please respect FlightRadar24's terms of service and do not spam the API with excessively frequent requests.

The request is made from the main process with Electron's `net.fetch`, not from Node's `fetch` or an HTTP library. FlightRadar24 sits behind bot protection that rejects ordinary HTTP clients on their TLS fingerprint alone -- correct browser headers make no difference -- while Chromium's own network stack is let through.

## Disclaimer
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

# Desktop Flight Board (日本語)

Electronで構築された、FlightRadar24 API (Application Programming Interface) を使用して空港のリアルタイムな出発・到着情報を表示する、美しくフレームレスなデスクトップウィジェットです。

## 特徴
- **プレミアムなUI:** ダークテーマ、フレームレス、透過背景を採用。現代の空港の電光掲示板の美しさを再現しています。
- **リアルタイムデータ:** FlightRadar24 から直接ライブフライトデータを取得します。Electron 以外の実行環境は不要です。
- **出発・到着の切替:** 設定メニューから出発便／到着便を切り替えられます。ヘッダー、機体アイコン、時刻・行先/出発地の見出しも連動して切り替わります。
- **航空会社ロゴ:** Kiwi.com CDN (Content Delivery Network) を利用して、公式の航空会社ロゴを自動で表示します。
- **複数空港対応:** 設定メニューから日本・台湾の18空港を切り替えられます。ドロップダウンはグループ分けされています:
  - **日本:** 羽田(HND)、成田(NRT)
  - **台湾 — 本島:** 桃園(TPE)、台北松山(TSA)、台中(RMQ)、嘉義(CYI)、台南(TNN)、高雄(KHH)、花蓮(HUN)、台東(TTT)
  - **台湾 — 離島:** 澎湖・馬公(MZG)、望安(WOT)、七美(CMJ)、金門(KNH)、馬祖南竿(LZN)、馬祖北竿(MFK)、緑島(GNI)、蘭嶼(KYD)

  ※ 徳安航空のみが就航する4離島(望安・七美・緑島・蘭嶼)は、FlightRadar24 がスケジュールを収録していないため、便が表示されません。
- **日本語・台湾華語対応:** 歯車アイコンから表示言語を切り替えられます。ラベルと都市名324件すべてに両言語を用意しており、繁体字は台湾の慣用表記(シドニー=雪梨、大陸の悉尼ではなく)、台湾の地名は正式表記の「臺」を採用しています。英語表記は常に併記されるため、空港の電光掲示板と同じ2言語表示になります。
- **スクロール可能:** 出発便が多い場合でも、シームレスにスクロールして一覧を確認できます。

## 前提条件
- Node.js

## インストール方法

```bash
npm install
```

## 使い方

Electronアプリを起動します:
```bash
npm start
```

ウィンドウはフレームレスです。ボード上をドラッグすると移動でき、ヘッダー右の **×** をクリック（または **Esc** キー）で終了します。 歯車アイコンで設定パネルが開き、表示言語を選べます。選択は次回起動時にも保持されます。

時刻はすべて**表示中の空港のローカル時刻**です（実行端末の時刻ではありません）。台北のボードは東京より1時間遅い表示になり、現地の掲示板と一致します。

到着ボードの `Terminal` / `Gate` は、表示中の空港側の到着ターミナル・ゲートです。FlightRadar24 の収録状況は空港差が大きく、桃園はほぼ全便にゲートが付きますが、羽田はほとんど付きません。

## カスタマイズ方法
- **空港の追加:** `index.html` に `<option>` を追加し、`renderer.js` の `airportCountries` に国コード（国内線/国際線フィルタの判定に使用）、`uiText.<言語>.airports` に各言語のラベルを追記します。
- **都市名翻訳の追加:** `renderer.js` 内の `cityNames` にエントリを追加します。1エントリが全言語を持つため、片方だけ訳し忘れることがありません。
- **更新頻度の変更:** `renderer.js` 内の `setInterval` の数値を変更することで更新頻度を調整できます（デフォルトは600,000ms＝10分です）。

## 注意事項
このプロジェクトは教育目的で FlightRadar24 の非公式エンドポイントを参照しています。FlightRadar24の利用規約を尊重し、過剰な頻度でのAPIリクエスト（スパム行為）は行わないでください。

リクエストは Node の `fetch` やHTTPライブラリではなく、mainプロセスの Electron `net.fetch` から行っています。FlightRadar24 はボット対策の背後にあり、通常のHTTPクライアントはTLSフィンガープリントだけで弾かれるためです（ブラウザ相当のヘッダを付けても通りません）。Chromium 自身のネットワークスタックであれば通過します。

## 免責事項
本ソフトウェアは「現状のまま」で、明示であるか暗黙であるかを問わず、何らの保証もなく提供されます。ここでいう保証とは、商品性、特定の目的への適合性、および権利非侵害についての保証も含みますが、それに限定されるものではありません。作者または著作権者は、契約行為、不法行為、またはそれ以外であろうと、ソフトウェアに起因または関連し、あるいはソフトウェアの使用またはその他の扱いによって生じる一切の請求、損害、その他の義務について何らの責任も負わないものとします。

<!--
※免責事項の出典: Open Source Initiative (OSI) - The MIT License
https://opensource.org/licenses/MIT
-->
