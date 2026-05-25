// =========================================================
// DallyTrip — i18n (KO / EN / JA / ZH)
// =========================================================
(function () {
  const STORAGE_KEY = 'dt_lang';
  const SUPPORTED = ['ko', 'en', 'ja', 'zh'];
  const LANG_LABELS = { ko: '한국어', en: 'English', ja: '日本語', zh: '中文' };
  const LANG_SHORT  = { ko: 'KO',     en: 'EN',      ja: 'JA',     zh: 'ZH' };

  const DICT = {
    // ============== Common chrome ==============
    'brand.tagline':            { ko:'Travel with $1', en:'Travel with $1', ja:'Travel with $1', zh:'Travel with $1' },

    'nav.about':                { ko:'서비스 소개',    en:'About',           ja:'サービス紹介',    zh:'关于' },
    'nav.howItWorks':           { ko:'이용 방법',      en:'How it works',    ja:'使い方',         zh:'使用方法' },
    'nav.destinations':         { ko:'여행지',         en:'Destinations',    ja:'目的地',         zh:'目的地' },

    'btn.connectWallet':        { ko:'지갑 연결',      en:'Connect Wallet',  ja:'ウォレット接続',   zh:'连接钱包' },
    'btn.disconnect':           { ko:'연결 해제',      en:'Disconnect',      ja:'切断',           zh:'断开连接' },
    'btn.launchApp':            { ko:'앱 시작하기',    en:'Launch App',      ja:'アプリを開く',    zh:'启动应用' },
    'btn.launchDally':          { ko:'DallyTrip 시작', en:'Launch DallyTrip',ja:'DallyTripを開く', zh:'启动 DallyTrip' },
    'btn.explore':              { ko:'여행 둘러보기',  en:'Explore Trips',   ja:'旅を探す',       zh:'探索行程' },
    'btn.search':               { ko:'검색',           en:'Search',          ja:'検索',           zh:'搜索' },
    'btn.searchTrips':          { ko:'여행 검색',      en:'Search Trips',    ja:'旅を検索',       zh:'搜索行程' },
    'btn.view':                 { ko:'보기',           en:'View',            ja:'見る',           zh:'查看' },
    'btn.viewAll':              { ko:'전체 보기',      en:'See all',         ja:'すべて見る',      zh:'查看全部' },
    'btn.book':                 { ko:'예약',           en:'Book',            ja:'予約',           zh:'预订' },
    'btn.payWithDollar':        { ko:'$1로 결제',      en:'Pay with $1',     ja:'$1で支払う',      zh:'用 $1 支付' },
    'btn.confirmPayment':       { ko:'결제 확인',      en:'Confirm Payment', ja:'支払いを確認',    zh:'确认支付' },
    'btn.viewBooking':          { ko:'예약 보기',      en:'View Booking',    ja:'予約を見る',      zh:'查看预订' },
    'btn.viewMyBookings':       { ko:'내 예약 보기',   en:'View My Bookings',ja:'マイ予約を見る',  zh:'查看我的预订' },
    'btn.backHome':             { ko:'홈으로',         en:'Back to Home',    ja:'ホームへ',       zh:'返回首页' },
    'btn.backLanding':          { ko:'← 랜딩으로',     en:'← Back to landing',ja:'← ランディングへ',zh:'← 返回首页' },
    'btn.backSite':             { ko:'← 사이트로',     en:'← Back to site',  ja:'← サイトへ',     zh:'← 返回站点' },
    'btn.save':                 { ko:'저장',           en:'Save',            ja:'保存',           zh:'保存' },
    'btn.cancel':               { ko:'취소',           en:'Cancel',          ja:'キャンセル',      zh:'取消' },
    'btn.signin':               { ko:'로그인',         en:'Sign in',         ja:'サインイン',      zh:'登录' },
    'btn.signout':              { ko:'로그아웃',       en:'Sign out',        ja:'サインアウト',    zh:'退出登录' },
    'btn.exploreApp':           { ko:'여행 둘러보기',  en:'Explore trips',   ja:'旅を探す',       zh:'探索行程' },
    'btn.adminPanel':           { ko:'관리자 페이지',  en:'Admin Panel',     ja:'管理画面',       zh:'管理后台' },
    'btn.topup':                { ko:'충전',           en:'Top up',          ja:'チャージ',       zh:'充值' },
    'btn.exportCsv':            { ko:'CSV 내보내기',   en:'Export CSV',      ja:'CSVエクスポート', zh:'导出 CSV' },
    'btn.export':               { ko:'내보내기',       en:'Export',          ja:'エクスポート',    zh:'导出' },
    'btn.addProduct':           { ko:'+ 상품 추가',    en:'+ Add product',   ja:'+ 商品を追加',   zh:'+ 添加商品' },
    'btn.newProduct':           { ko:'+ 새 상품',      en:'+ New product',   ja:'+ 新商品',       zh:'+ 新商品' },
    'btn.newBanner':            { ko:'+ 새 배너',      en:'+ New banner',    ja:'+ 新バナー',     zh:'+ 新横幅' },
    'btn.saveSettings':         { ko:'설정 저장',      en:'Save settings',   ja:'設定を保存',     zh:'保存设置' },
    'btn.saveProduct':          { ko:'상품 저장',      en:'Save product',    ja:'商品を保存',     zh:'保存商品' },
    'btn.saveBanner':           { ko:'배너 저장',      en:'Save banner',     ja:'バナーを保存',    zh:'保存横幅' },
    'btn.connectFirst':         { ko:'먼저 지갑 연결', en:'Connect Wallet First',ja:'まずウォレット接続', zh:'请先连接钱包' },
    'btn.delete':               { ko:'삭제',           en:'Delete',          ja:'削除',           zh:'删除' },
    'btn.hide':                 { ko:'숨기기',         en:'Hide',            ja:'非表示',         zh:'隐藏' },
    'btn.show':                 { ko:'노출',           en:'Show',            ja:'表示',           zh:'显示' },

    'common.date':              { ko:'날짜',           en:'Date',            ja:'日付',           zh:'日期' },
    'common.dates':             { ko:'기간',           en:'Dates',           ja:'期間',           zh:'日期范围' },
    'common.guests':            { ko:'인원',           en:'Guests',          ja:'人数',           zh:'人数' },
    'common.adults':            { ko:'성인',           en:'Adults',          ja:'大人',           zh:'成人' },
    'common.children':          { ko:'아동',           en:'Children',        ja:'子供',           zh:'儿童' },
    'common.checkin':           { ko:'체크인',         en:'Check-in',        ja:'チェックイン',    zh:'入住' },
    'common.checkout':          { ko:'체크아웃',       en:'Check-out',       ja:'チェックアウト',  zh:'退房' },
    'common.total':             { ko:'합계',           en:'Total',           ja:'合計',           zh:'合计' },
    'common.amount':            { ko:'금액',           en:'Amount',          ja:'金額',           zh:'金额' },
    'common.network':           { ko:'네트워크',       en:'Network',         ja:'ネットワーク',    zh:'网络' },
    'common.token':             { ko:'토큰',           en:'Token',           ja:'トークン',       zh:'代币' },
    'common.balance':           { ko:'잔액',           en:'Balance',         ja:'残高',           zh:'余额' },
    'common.status':            { ko:'상태',           en:'Status',          ja:'状態',           zh:'状态' },
    'common.actions':           { ko:'동작',           en:'Actions',         ja:'アクション',     zh:'操作' },
    'common.from':              { ko:'시작가',         en:'From',            ja:'最安',           zh:'起价' },
    'common.results':           { ko:'개 결과',         en:'results',         ja:'件',             zh:'结果' },
    'common.notConnected':      { ko:'미연결',         en:'Not connected',   ja:'未接続',         zh:'未连接' },
    'common.address':           { ko:'주소',           en:'Address',         ja:'アドレス',       zh:'地址' },
    'common.product':           { ko:'상품',           en:'Product',         ja:'商品',           zh:'商品' },
    'common.category':          { ko:'카테고리',       en:'Category',        ja:'カテゴリー',      zh:'类别' },
    'common.country':           { ko:'국가',           en:'Country',         ja:'国',             zh:'国家' },
    'common.city':              { ko:'도시',           en:'City',            ja:'都市',           zh:'城市' },
    'common.price':             { ko:'가격',           en:'Price',           ja:'価格',           zh:'价格' },
    'common.image':             { ko:'이미지',         en:'Image',           ja:'画像',           zh:'图片' },
    'common.created':           { ko:'생성일',         en:'Created',         ja:'作成日',         zh:'创建于' },
    'common.title':             { ko:'제목',           en:'Title',           ja:'タイトル',       zh:'标题' },
    'common.subtitle':          { ko:'서브제목',       en:'Subtitle',        ja:'サブタイトル',    zh:'副标题' },
    'common.email':             { ko:'이메일',         en:'Email',           ja:'メール',         zh:'邮箱' },
    'common.password':          { ko:'비밀번호',       en:'Password',        ja:'パスワード',     zh:'密码' },
    'common.language':          { ko:'언어',           en:'Language',        ja:'言語',           zh:'语言' },
    'common.option':            { ko:'옵션',           en:'Option',          ja:'オプション',     zh:'选项' },
    'common.included':          { ko:'포함 사항',      en:"What's included", ja:'含まれるもの',    zh:'包含项' },
    'common.notIncluded':       { ko:'불포함 사항',    en:'Not included',    ja:'含まれないもの',  zh:'不包含' },
    'common.cancelPolicy':      { ko:'취소 정책',      en:'Cancellation policy', ja:'キャンセルポリシー', zh:'取消政策' },
    'common.allCat':            { ko:'전체',           en:'All categories',  ja:'すべてのカテゴリー',zh:'所有类别' },
    'common.allStatus':         { ko:'전체 상태',      en:'All status',      ja:'すべての状態',    zh:'全部状态' },
    'common.live':              { ko:'노출',           en:'Live',            ja:'公開中',         zh:'上线' },
    'common.hidden':            { ko:'숨김',           en:'Hidden',          ja:'非表示',         zh:'隐藏' },

    'units.night':              { ko:'박',             en:'night',           ja:'泊',             zh:'晚' },
    'units.nights':             { ko:'박',             en:'nights',          ja:'泊',             zh:'晚' },
    'units.pp':                 { ko:'1인',            en:'pp',              ja:'1名',            zh:'每人' },
    'units.guestsPlural':       { ko:'명',             en:'guests',          ja:'名',             zh:'位' },

    'footer.copy':              { ko:'© 2026 DallyTrip · Travel with $1', en:'© 2026 DallyTrip · Travel with $1', ja:'© 2026 DallyTrip · Travel with $1', zh:'© 2026 DallyTrip · Travel with $1' },
    'footer.terms':             { ko:'이용약관',       en:'Terms',           ja:'利用規約',       zh:'条款' },
    'footer.privacy':           { ko:'개인정보',       en:'Privacy',         ja:'プライバシー',    zh:'隐私' },
    'footer.contact':           { ko:'문의',           en:'Contact',         ja:'お問い合わせ',    zh:'联系' },

    // ============== Landing ==============
    'hero.tag':                 { ko:'TON Chain · $1 토큰 전용', en:'TON Chain · $1 Token Only', ja:'TON Chain · $1トークン専用', zh:'TON Chain · 仅限 $1 代币' },
    'hero.titleA':              { ko:'$1으로 ',        en:'Travel ',         ja:'$1で',           zh:'用 $1' },
    'hero.titleB':              { ko:'떠나는 ',        en:'with ',           ja:'旅へ',            zh:'去' },
    'hero.titleC':              { ko:'여행.',           en:'$1.',             ja:'$1.',            zh:'$1.' },
    'hero.desc':                { ko:'TON Chain의 <b>$1 토큰</b>으로 호텔, 투어, 액티비티를 예약하세요. 카드도, 은행도, USDT도 필요 없습니다. 오직 한 가지 토큰.',
                                  en:'Book hotels, tours and activities with <b>$1 Token</b> on TON Chain. No cards. No banks. Just one token.',
                                  ja:'TON Chainの<b>$1トークン</b>でホテル、ツアー、アクティビティを予約。カードも銀行も不要。たったひとつのトークン。',
                                  zh:'用 TON Chain 的 <b>$1 代币</b>预订酒店、行程和活动。无需信用卡或银行，仅需一种代币。' },
    'hero.quick.destination':   { ko:'여행지',         en:'Destination',     ja:'目的地',         zh:'目的地' },
    'hero.quick.destinationVal':{ ko:'베트남 다낭',    en:'Da Nang, Vietnam',ja:'ベトナム ダナン', zh:'越南岘港' },
    'hero.quick.checkin':       { ko:'체크인',         en:'Check-in',        ja:'チェックイン',    zh:'入住' },
    'hero.quick.selectDate':    { ko:'날짜 선택',      en:'Select date',     ja:'日付を選択',     zh:'选择日期' },
    'hero.quick.guests':        { ko:'인원',           en:'Guests',          ja:'人数',           zh:'人数' },
    'hero.quick.guestsVal':     { ko:'성인 2명',       en:'2 adults',        ja:'大人2名',        zh:'2位成人' },
    'hero.wallet.label':        { ko:'지갑',           en:'Wallet',          ja:'ウォレット',     zh:'钱包' },
    'hero.resort.name':         { ko:'다낭 리조트',    en:'Da Nang Resort',  ja:'ダナン リゾート', zh:'岘港度假村' },
    'hero.resort.per':          { ko:'/ 박',           en:'/ night',         ja:'/ 泊',           zh:'/ 晚' },

    'feat.payment.title':       { ko:'$1 전용 결제',   en:'$1 Only Payment', ja:'$1専用決済',     zh:'仅限 $1 支付' },
    'feat.payment.desc':        { ko:'모든 예약은 $1 토큰으로만 결제됩니다. 카드도, 은행도, 다른 코인도 없습니다.', en:'All bookings are paid only with $1 Token. No cards, no banks, no other crypto.', ja:'すべての予約は$1トークンのみで決済。カード・銀行・他の暗号資産は不要。', zh:'所有预订仅以 $1 代币结算，无需信用卡、银行或其他加密货币。' },
    'feat.wallet.title':        { ko:'TON 지갑 연결',  en:'TON Wallet Connect',ja:'TONウォレット接続', zh:'TON 钱包连接' },
    'feat.wallet.desc':         { ko:'TonConnect로 TON 지갑을 연결하고 원클릭으로 예약하세요.', en:'Connect your TON wallet via TonConnect and book instantly with one click.', ja:'TonConnectでTONウォレットを接続し、ワンクリックで予約。', zh:'通过 TonConnect 连接你的 TON 钱包，一键完成预订。' },
    'feat.travel.title':        { ko:'Web3 여행',      en:'Web3 Travel',     ja:'Web3トラベル',    zh:'Web3 旅行' },
    'feat.travel.desc':         { ko:'호텔, 투어, 액티비티 — 하나의 심플한 Web3 여행앱에서.', en:'Hotels, tours and activities — booked in one simple Web3 travel app.', ja:'ホテル、ツアー、アクティビティをひとつのWeb3トラベルアプリで。', zh:'酒店、行程与活动 — 一个简单的 Web3 旅行应用一站搞定。' },

    'how.kicker':               { ko:'4단계',          en:'4 simple steps',  ja:'4ステップ',       zh:'4 个简单步骤' },
    'how.title':                { ko:'이용 방법',      en:'How it works',    ja:'使い方',         zh:'使用方法' },
    'how.step':                 { ko:'STEP',           en:'Step',            ja:'STEP',           zh:'步骤' },
    'how.1.title':              { ko:'TON 지갑 연결',  en:'Connect TON wallet',ja:'TONウォレットを接続', zh:'连接 TON 钱包' },
    'how.1.desc':               { ko:'Connect Wallet 누르고 TonConnect로 승인.', en:'Tap Connect Wallet and approve via TonConnect.', ja:'Connect Walletをタップし、TonConnectで承認。', zh:'点击 Connect Wallet 并通过 TonConnect 授权。' },
    'how.2.title':              { ko:'여행 상품 선택', en:'Pick a trip',      ja:'旅を選ぶ',       zh:'选择行程' },
    'how.2.desc':               { ko:'엄선된 리스트에서 호텔, 투어, 액티비티를 선택.', en:'Choose a hotel, tour or activity from curated lists.', ja:'厳選リストからホテル・ツアー・アクティビティを選択。', zh:'从精选清单中选择酒店、行程或活动。' },
    'how.3.title':              { ko:'$1로 결제',      en:'Pay with $1',     ja:'$1で支払う',      zh:'用 $1 支付' },
    'how.3.desc':               { ko:'단일 $1 토큰 트랜잭션으로 결제 확인.', en:'Confirm payment with a single $1 token transaction.', ja:'1回の$1トークン取引で支払い完了。', zh:'通过一笔 $1 代币交易完成支付。' },
    'how.4.title':              { ko:'여행 즐기기',    en:'Enjoy your trip', ja:'旅を楽しむ',     zh:'享受旅程' },
    'how.4.desc':               { ko:'예약 확정 후 떠나면 끝.', en:'Receive booking confirmation and travel — that\'s it.', ja:'予約確認を受け取って出発するだけ。', zh:'收到预订确认后出发，就这么简单。' },

    'dest.title':               { ko:'인기 여행지',    en:'Popular destinations',ja:'人気の目的地',zh:'热门目的地' },

    'cta.kicker':               { ko:'여행을 떠날 준비?', en:'Ready to travel?',ja:'旅に出る準備は？',zh:'准备出发？' },
    'cta.title':                { ko:'하나의 토큰.<br/>무한한 여행지.', en:'One token.<br/>Infinite destinations.', ja:'ひとつのトークン。<br/>無限の目的地。', zh:'一种代币。<br/>无限目的地。' },
    'cta.desc':                 { ko:'DallyTrip을 시작하고 $1로 다음 여행을 즉시 온체인 예약하세요.', en:'Launch DallyTrip and book your next trip with $1 — instantly, on-chain.', ja:'DallyTripを開いて、次の旅を$1でオンチェーンですぐ予約。', zh:'启动 DallyTrip，立即以 $1 链上预订下一段旅程。' },

    // ============== App ==============
    'app.home.where':           { ko:'어디로 떠나시나요?', en:'Where are you going?', ja:'どこへ行きますか？', zh:'你想去哪？' },
    'app.home.searchPh':        { ko:'여행지 또는 호텔 검색', en:'Search destination or hotel', ja:'目的地・ホテルを検索', zh:'搜索目的地或酒店' },
    'app.home.popular':         { ko:'인기 여행지',    en:'Popular destinations',ja:'人気の目的地',zh:'热门目的地' },
    'app.home.featured':        { ko:'추천 여행',      en:'Featured trips',  ja:'おすすめの旅',    zh:'精选行程' },
    'app.home.bannerKicker':    { ko:'$1로만 결제',    en:'Pay only with $1',ja:'$1で支払い専用',  zh:'仅以 $1 支付' },
    'app.home.bannerTitle':     { ko:'모든 예약 — 하나의 토큰, 한 번의 탭.', en:'Every booking — one token, one tap.', ja:'すべての予約をひとつのトークン、ワンタップで。', zh:'每一次预订 — 一枚代币，一次点按。' },
    'app.home.bannerDesc':      { ko:'카드도 은행도 없습니다. TON 지갑을 연결하고 시작하세요.', en:'No cards. No banks. Connect your TON wallet to start.', ja:'カードも銀行も不要。TONウォレットを接続して始めましょう。', zh:'无需信用卡或银行。连接 TON 钱包即可开始。' },
    'app.home.manageWallet':    { ko:'지갑 관리',      en:'Manage Wallet',   ja:'ウォレット管理',  zh:'管理钱包' },

    'app.search.placeholder':   { ko:'여행지, 호텔, 투어 검색...', en:'Search destination, hotel, tour...', ja:'目的地・ホテル・ツアーを検索...', zh:'搜索目的地、酒店、行程…' },
    'app.search.resultsNote':   { ko:'· $1로만 결제',  en:'· paid in $1 only',ja:'· $1のみで決済', zh:'· 仅以 $1 支付' },
    'app.search.priceAsc':      { ko:'가격 ↑',         en:'Price ↑',         ja:'価格 ↑',         zh:'价格 ↑' },
    'app.search.rating':        { ko:'평점',           en:'Rating',          ja:'評価',           zh:'评分' },
    'app.search.noResults':     { ko:'결과가 없습니다',en:'No results',      ja:'結果がありません',zh:'无结果' },
    'app.search.noResultsDesc': { ko:'다른 키워드 또는 카테고리를 시도해 보세요.', en:'Try another keyword or category.', ja:'別のキーワードやカテゴリーをお試しください。', zh:'尝试其他关键字或类别。' },

    'app.product.reviews':      { ko:'리뷰',           en:'reviews',         ja:'件のレビュー',    zh:'条评论' },
    'app.product.dollarOnly':   { ko:'$1만',           en:'$1 only',         ja:'$1のみ',         zh:'仅 $1' },
    'app.product.base':         { ko:'기본가',         en:'Base',            ja:'基本料金',       zh:'基础价' },
    'app.product.guestsNights': { ko:'인원/박',        en:'Guests / Nights', ja:'人数/泊数',      zh:'人数 / 晚数' },
    'app.product.networkNote':  { ko:'$1 토큰 전용 · TON Chain', en:'$1 token only · TON Chain', ja:'$1トークン専用 · TON Chain', zh:'仅限 $1 代币 · TON Chain' },
    'app.product.room':         { ko:'객실',           en:'Room',            ja:'部屋',           zh:'房型' },

    'app.checkout.title':       { ko:'결제 확인',      en:'Confirm payment', ja:'お支払いの確認',  zh:'确认支付' },
    'app.checkout.desc':        { ko:'TON Chain의 <b>$1 토큰</b>으로만 결제됩니다.', en:'Pay with <b>$1 Token only</b> on TON Chain.', ja:'TON Chainの<b>$1トークン</b>のみで決済。', zh:'仅以 TON Chain 的 <b>$1 代币</b>支付。' },
    'app.checkout.summary':     { ko:'예약 요약',      en:'Booking summary', ja:'予約サマリー',    zh:'预订摘要' },
    'app.checkout.wallet':      { ko:'지갑',           en:'Wallet',          ja:'ウォレット',     zh:'钱包' },
    'app.checkout.payment':     { ko:'결제',           en:'Payment',         ja:'お支払い',       zh:'支付' },
    'app.checkout.networkFee':  { ko:'네트워크 수수료',en:'Network fee',     ja:'ネットワーク手数料',zh:'网络手续费' },
    'app.checkout.insufficient':{ ko:'⚠ $1 잔액이 부족합니다.', en:'⚠ Insufficient $1 balance.', ja:'⚠ $1残高が不足しています。', zh:'⚠ $1 余额不足。' },

    'app.success.title':        { ko:'예약 요청 완료', en:'Booking requested',ja:'予約をリクエストしました',zh:'已发送预订请求' },
    'app.success.desc':         { ko:'예약 요청이 접수되었습니다.<br/>DallyTrip 팀이 곧 예약을 확정합니다.', en:'Your booking has been requested.<br/>The DallyTrip team will confirm your reservation shortly.', ja:'予約リクエストを受け付けました。<br/>DallyTripチームがまもなく確定します。', zh:'已收到您的预订请求。<br/>DallyTrip 团队将尽快确认。' },
    'app.success.bookingId':    { ko:'예약 번호',      en:'Booking ID',      ja:'予約番号',       zh:'预订编号' },

    'app.bookings.title':       { ko:'내 예약',        en:'My bookings',     ja:'マイ予約',       zh:'我的预订' },
    'app.bookings.empty':       { ko:'아직 예약이 없습니다', en:'No bookings yet', ja:'予約がありません', zh:'还没有预订' },
    'app.bookings.emptyDesc':   { ko:'첫 $1 여행 예약을 시작하세요.', en:'Make your first $1 trip booking.', ja:'最初の$1旅行予約をしましょう。', zh:'开始你的第一次 $1 行程预订。' },

    'app.wallet.title':         { ko:'지갑',           en:'Wallet',          ja:'ウォレット',     zh:'钱包' },
    'app.wallet.connectTitle':  { ko:'TON 지갑을 연결하세요', en:'Connect your TON wallet', ja:'TONウォレットを接続', zh:'连接你的 TON 钱包' },
    'app.wallet.connectDesc':   { ko:'모든 여행을 $1 토큰으로 한 번에 결제하세요.', en:'Pay all your trips with $1 Token in one tap.', ja:'すべての旅を$1トークンで一発決済。', zh:'用 $1 代币一键支付所有行程。' },
    'app.wallet.cardLabel':     { ko:'DallyTrip 지갑', en:'DallyTrip Wallet',ja:'DallyTrip ウォレット',zh:'DallyTrip 钱包' },
    'app.wallet.recent':        { ko:'최근 거래',      en:'Recent transactions', ja:'最近の取引',  zh:'最近交易' },
    'app.wallet.type':          { ko:'유형',           en:'Type',            ja:'種類',           zh:'类型' },
    'app.wallet.tx':            { ko:'트랜잭션',       en:'Tx',              ja:'Tx',             zh:'交易' },
    'app.wallet.empty':         { ko:'아직 거래가 없습니다', en:'No transactions yet', ja:'取引がありません', zh:'还没有交易' },

    'app.profile.title':        { ko:'마이페이지',     en:'My page',         ja:'マイページ',     zh:'我的' },
    'app.profile.traveler':     { ko:'TON 트래블러',   en:'TON Traveler',    ja:'TONトラベラー',  zh:'TON 旅行者' },
    'app.profile.guest':        { ko:'게스트',         en:'Guest',           ja:'ゲスト',         zh:'访客' },
    'app.profile.myBookings':   { ko:'내 예약',        en:'My bookings',     ja:'マイ予約',       zh:'我的预订' },
    'app.profile.bookingsCount':{ ko:'건',             en:'total',           ja:'件',             zh:'笔' },
    'app.profile.help':         { ko:'고객센터',       en:'Help center',     ja:'ヘルプセンター',  zh:'帮助中心' },
    'app.profile.helpDesc':     { ko:'FAQ, 지원, 문의',en:'FAQ, support, contact',ja:'FAQ・サポート・問い合わせ',zh:'FAQ、支持、联系' },

    'bottom.home':              { ko:'홈',             en:'Home',            ja:'ホーム',         zh:'首页' },
    'bottom.search':            { ko:'검색',           en:'Search',          ja:'検索',           zh:'搜索' },
    'bottom.bookings':          { ko:'예약',           en:'Bookings',        ja:'予約',           zh:'预订' },
    'bottom.wallet':            { ko:'지갑',           en:'Wallet',          ja:'ウォレット',     zh:'钱包' },
    'bottom.my':                { ko:'마이',           en:'My',              ja:'マイ',           zh:'我的' },

    'cat.All':                  { ko:'전체',           en:'All',             ja:'すべて',         zh:'全部' },
    'cat.Flights':              { ko:'항공권',         en:'Flights',         ja:'航空券',         zh:'机票' },
    'cat.Hotels':               { ko:'숙소',           en:'Hotels',          ja:'ホテル',         zh:'酒店' },
    'cat.Tours':                { ko:'투어',           en:'Tours',           ja:'ツアー',         zh:'行程' },
    'cat.Activities':           { ko:'액티비티',       en:'Activities',      ja:'アクティビティ',  zh:'活动' },
    'cat.Transport':            { ko:'교통',           en:'Transport',       ja:'交通',           zh:'交通' },
    'cat.AirportPickup':        { ko:'공항픽업',       en:'Airport Pickup',  ja:'空港送迎',       zh:'机场接送' },
    'cat.Hotel':                { ko:'숙소',           en:'Hotel',           ja:'ホテル',         zh:'酒店' },
    'cat.Tour':                 { ko:'투어',           en:'Tour',            ja:'ツアー',         zh:'行程' },
    'cat.Activity':             { ko:'액티비티',       en:'Activity',        ja:'アクティビティ',  zh:'活动' },
    'cat.Pickup':               { ko:'공항픽업',       en:'Pickup',          ja:'送迎',           zh:'接送' },
    'cat.Flight':               { ko:'항공편',         en:'Flight',          ja:'フライト',       zh:'航班' },
    'cat.TransportItem':        { ko:'교통편',         en:'Transport',       ja:'交通機関',       zh:'交通' },

    // Flight-specific
    'flight.from':              { ko:'출발지',         en:'From',            ja:'出発地',         zh:'出发地' },
    'flight.to':                { ko:'도착지',         en:'To',              ja:'到着地',         zh:'到达地' },
    'flight.departure':         { ko:'출발일',         en:'Departure',       ja:'出発日',         zh:'出发日期' },
    'flight.return':            { ko:'복귀일',         en:'Return',          ja:'帰着日',         zh:'返程日期' },
    'flight.cabinClass':        { ko:'좌석 등급',      en:'Cabin class',     ja:'座席クラス',     zh:'舱位等级' },
    'flight.economy':           { ko:'이코노미',       en:'Economy',         ja:'エコノミー',     zh:'经济舱' },
    'flight.business':          { ko:'비즈니스',       en:'Business',        ja:'ビジネス',       zh:'商务舱' },
    'flight.first':             { ko:'퍼스트',         en:'First',           ja:'ファースト',     zh:'头等舱' },
    'flight.oneway':            { ko:'편도',           en:'One-way',         ja:'片道',           zh:'单程' },
    'flight.roundtrip':         { ko:'왕복',           en:'Round-trip',      ja:'往復',           zh:'往返' },
    'flight.duration':          { ko:'비행시간',       en:'Duration',        ja:'所要時間',       zh:'航程时长' },
    'flight.stops':             { ko:'경유',           en:'Stops',           ja:'経由',           zh:'中转' },
    'flight.nonstop':           { ko:'직항',           en:'Non-stop',        ja:'直行',           zh:'直飞' },
    'flight.airline':           { ko:'항공사',         en:'Airline',         ja:'航空会社',       zh:'航空公司' },
    'flight.depart':            { ko:'출발',           en:'Depart',          ja:'出発',           zh:'出发' },
    'flight.arrive':            { ko:'도착',           en:'Arrive',          ja:'到着',           zh:'到达' },
    'flight.baggage':           { ko:'수하물',         en:'Baggage',         ja:'手荷物',         zh:'行李' },
    'flight.seat':              { ko:'좌석',           en:'Seat',            ja:'座席',           zh:'座位' },
    'flight.passenger':         { ko:'승객',           en:'Passenger',       ja:'乗客',           zh:'乘客' },

    // Transport-specific
    'transport.pickupAddr':     { ko:'픽업 주소',      en:'Pickup address',  ja:'乗車地',         zh:'上车地点' },
    'transport.dropoffAddr':    { ko:'드롭 주소',      en:'Drop-off address',ja:'降車地',         zh:'下车地点' },
    'transport.pickupTime':     { ko:'픽업 시간',      en:'Pickup time',     ja:'乗車時間',       zh:'上车时间' },
    'transport.vehicle':        { ko:'차량',           en:'Vehicle',         ja:'車両',           zh:'车型' },
    'transport.sedan':          { ko:'세단',           en:'Sedan',           ja:'セダン',         zh:'轿车' },
    'transport.suv':            { ko:'SUV',            en:'SUV',             ja:'SUV',            zh:'SUV' },
    'transport.van':            { ko:'밴',             en:'Van',             ja:'バン',           zh:'面包车' },
    'transport.duration':       { ko:'예상 시간',      en:'Est. duration',   ja:'所要時間',       zh:'预计时长' },
    'transport.distance':       { ko:'거리',           en:'Distance',        ja:'距離',           zh:'距离' },
    'transport.driver':         { ko:'운전기사',       en:'Driver',          ja:'ドライバー',     zh:'司机' },
    'transport.maxPax':         { ko:'최대 탑승',      en:'Max pax',         ja:'最大乗車',       zh:'最大乘客' },

    'status.Payment Completed': { ko:'결제완료',       en:'Payment Completed',ja:'決済完了',      zh:'已支付' },
    'status.Pending Confirmation':{ ko:'예약확인중',   en:'Pending Confirmation',ja:'確認待ち',   zh:'待确认' },
    'status.Confirmed':         { ko:'예약확정',       en:'Confirmed',       ja:'確定',           zh:'已确认' },
    'status.Completed':         { ko:'이용완료',       en:'Completed',       ja:'完了',           zh:'已完成' },
    'status.Cancel Requested':  { ko:'취소요청',       en:'Cancel Requested',ja:'キャンセル申請',  zh:'取消请求' },
    'status.Cancelled':         { ko:'취소완료',       en:'Cancelled',       ja:'キャンセル済み',  zh:'已取消' },
    'status.Refunded':          { ko:'환불됨',         en:'Refunded',        ja:'返金済み',       zh:'已退款' },
    'status.Live':              { ko:'노출',           en:'Live',            ja:'公開中',         zh:'上线' },
    'status.Hidden':            { ko:'숨김',           en:'Hidden',          ja:'非表示',         zh:'隐藏' },
    'status.Active':            { ko:'활성',           en:'Active',          ja:'有効',           zh:'活跃' },
    'status.Suspended':         { ko:'정지',           en:'Suspended',       ja:'停止',           zh:'已停用' },

    'toast.walletConnected':    { ko:'지갑 연결됨',    en:'Wallet connected',ja:'ウォレット接続済', zh:'钱包已连接' },
    'toast.walletDisconnected': { ko:'지갑 연결 해제', en:'Wallet disconnected',ja:'ウォレット切断',zh:'钱包已断开' },
    'toast.waitingWallet':      { ko:'지갑 승인 대기 중', en:'Waiting for wallet confirmation', ja:'ウォレット承認待ち', zh:'等待钱包确认' },
    'toast.txPending':          { ko:'트랜잭션 진행 중', en:'Transaction pending', ja:'トランザクション処理中', zh:'交易处理中' },
    'toast.paymentConfirmed':   { ko:'결제 완료',      en:'Payment confirmed',ja:'決済完了',      zh:'支付完成' },
    'toast.bookingRequested':   { ko:'예약 요청됨',    en:'Booking requested',ja:'予約リクエスト送信',zh:'已发送预订请求' },
    'toast.saved':              { ko:'저장됨',         en:'Saved',           ja:'保存しました',   zh:'已保存' },
    'toast.productSaved':       { ko:'상품 저장됨',    en:'Product saved',   ja:'商品を保存しました',zh:'商品已保存' },
    'toast.productDeleted':     { ko:'상품 삭제됨',    en:'Product deleted', ja:'商品を削除しました',zh:'商品已删除' },
    'toast.productHidden':      { ko:'상품 숨김 처리됨', en:'Product hidden', ja:'商品を非表示にしました', zh:'商品已隐藏' },
    'toast.productLive':        { ko:'상품 노출됨',    en:'Product is now Live', ja:'商品を公開しました', zh:'商品已上线' },
    'toast.statusUpdated':      { ko:'상태 변경됨: ',  en:'Status updated: ',ja:'状態を更新: ',   zh:'状态已更新: ' },
    'toast.settingsSaved':      { ko:'설정 저장됨',    en:'Settings saved',  ja:'設定を保存しました',zh:'设置已保存' },
    'toast.bannerAdded':        { ko:'배너 추가됨',    en:'Banner added',    ja:'バナーを追加',    zh:'横幅已添加' },
    'toast.welcomeAdmin':       { ko:'환영합니다, 관리자', en:'Welcome, admin', ja:'ようこそ管理者', zh:'欢迎，管理员' },
    'toast.copied':             { ko:'링크가 복사되었습니다', en:'Link copied', ja:'リンクをコピーしました', zh:'链接已复制' },
    'toast.favorite':           { ko:'즐겨찾기에 저장됨', en:'Saved to favorites', ja:'お気に入りに保存', zh:'已加入收藏' },
    'toast.tonExplorer':        { ko:'TON Explorer 열기 (데모)', en:'Open TON Explorer (demo)', ja:'TON Explorerを開く（デモ）', zh:'打开 TON Explorer (演示)' },
    'toast.comingSoon':         { ko:'곧 제공됩니다',  en:'Coming soon',     ja:'近日公開',       zh:'敬请期待' },
    'toast.topupDemo':          { ko:'충전 흐름 (데모)',en:'Top-up flow (demo)',ja:'チャージフロー（デモ）',zh:'充值流程 (演示)' },
    'toast.bookingDetail':      { ko:'예약 상세 (데모)',en:'Booking detail (demo)',ja:'予約詳細（デモ）',zh:'预订详情 (演示)' },
    'toast.userDetail':         { ko:'유저 상세 (데모)',en:'User detail (demo)',ja:'ユーザー詳細（デモ）',zh:'用户详情 (演示)' },
    'toast.tonconnectDemo':     { ko:'TonConnect 지갑 연결 (데모)', en:'TonConnect wallet connect (demo)', ja:'TonConnect ウォレット接続（デモ）', zh:'TonConnect 钱包连接 (演示)' },

    // ============== Admin ==============
    'admin.brand':              { ko:'DallyTrip 어드민', en:'DallyTrip Admin',ja:'DallyTrip 管理',zh:'DallyTrip 管理' },
    'admin.login.welcome':      { ko:'다시 오신 것을 환영합니다', en:'Welcome back', ja:'おかえりなさい', zh:'欢迎回来' },
    'admin.login.desc':         { ko:'상품, 예약, 결제를 관리하려면 로그인하세요.', en:'Sign in to manage products, bookings and payments.', ja:'商品・予約・決済を管理するためにサインイン。', zh:'登录以管理商品、预订与支付。' },

    'admin.side.dashboard':     { ko:'대시보드',       en:'Dashboard',       ja:'ダッシュボード',  zh:'仪表盘' },
    'admin.side.products':      { ko:'상품',           en:'Products',        ja:'商品',           zh:'商品' },
    'admin.side.bookings':      { ko:'예약',           en:'Bookings',        ja:'予約',           zh:'预订' },
    'admin.side.payments':      { ko:'결제',           en:'Payments',        ja:'決済',           zh:'支付' },
    'admin.side.users':         { ko:'회원',           en:'Users',           ja:'ユーザー',       zh:'用户' },
    'admin.side.banners':       { ko:'배너',           en:'Banners',         ja:'バナー',         zh:'横幅' },
    'admin.side.settings':      { ko:'설정',           en:'Settings',        ja:'設定',           zh:'设置' },
    'admin.side.adminWallet':   { ko:'관리자 지갑',    en:'Admin wallet',    ja:'管理者ウォレット',zh:'管理员钱包' },

    'admin.dash.kicker':        { ko:'환영합니다',     en:'Welcome back',    ja:'おかえりなさい', zh:'欢迎回来' },
    'admin.dash.title':         { ko:'대시보드',       en:'Dashboard',       ja:'ダッシュボード',  zh:'仪表盘' },
    'admin.dash.today':         { ko:'오늘 예약',      en:'Today bookings',  ja:'本日の予約',     zh:'今日预订' },
    'admin.dash.totalPay':      { ko:'총 결제',        en:'Total payments',  ja:'総決済額',       zh:'总支付' },
    'admin.dash.pending':       { ko:'확인 대기',      en:'Pending confirmations',ja:'確認待ち',  zh:'待确认' },
    'admin.dash.users':         { ko:'회원',           en:'Users',           ja:'ユーザー',       zh:'用户' },
    'admin.dash.recent':        { ko:'최근 예약',      en:'Recent bookings', ja:'最近の予約',     zh:'最近预订' },
    'admin.dash.viewAll':       { ko:'전체 보기 →',    en:'View all →',      ja:'すべて見る →',  zh:'查看全部 →' },
    'admin.dash.topDest':       { ko:'인기 여행지',    en:'Top destinations',ja:'人気の目的地',  zh:'热门目的地' },
    'admin.dash.bookings':      { ko:'건의 예약',       en:'bookings',        ja:'件の予約',       zh:'笔预订' },
    'admin.dash.statusMix':     { ko:'상태 분포',      en:'Status mix',      ja:'状態の内訳',     zh:'状态分布' },
    'admin.dash.booking':       { ko:'예약',           en:'Booking',         ja:'予約',           zh:'预订' },

    'admin.products.kicker':    { ko:'카탈로그',       en:'Catalog',         ja:'カタログ',       zh:'目录' },
    'admin.products.title':     { ko:'상품 관리',      en:'Products',        ja:'商品管理',       zh:'商品管理' },
    'admin.products.searchPh':  { ko:'상품명 또는 도시로 검색...', en:'Search by name or city...', ja:'商品名・都市で検索...', zh:'按名称或城市搜索…' },
    'admin.products.featured':  { ko:'추천',           en:'Featured',        ja:'おすすめ',       zh:'精选' },
    'admin.products.confirmDel':{ ko:'이 상품을 삭제할까요?', en:'Delete this product?', ja:'この商品を削除しますか？', zh:'确定删除该商品？' },

    'admin.pn.kicker':          { ko:'새 상품',        en:'New product',     ja:'新商品',         zh:'新商品' },
    'admin.pn.title':           { ko:'상품 등록',      en:'Create product',  ja:'商品を作成',     zh:'创建商品' },
    'admin.pn.basics':          { ko:'기본 정보',      en:'Basics',          ja:'基本情報',       zh:'基本信息' },
    'admin.pn.productName':     { ko:'상품명',         en:'Product name',    ja:'商品名',         zh:'商品名' },
    'admin.pn.address':         { ko:'주소',           en:'Address',         ja:'住所',           zh:'地址' },
    'admin.pn.media':           { ko:'미디어',         en:'Media',           ja:'メディア',       zh:'媒体' },
    'admin.pn.mainImg':         { ko:'대표 이미지 URL',en:'Main image URL',  ja:'メイン画像URL',   zh:'主图 URL' },
    'admin.pn.galleryImg':      { ko:'갤러리 URL (한 줄에 하나)', en:'Gallery URLs (one per line)', ja:'ギャラリーURL（1行に1つ）', zh:'图库 URL（每行一个）' },
    'admin.pn.desc':            { ko:'설명',           en:'Description',     ja:'説明',           zh:'描述' },
    'admin.pn.included':        { ko:'포함 사항',      en:'Included',        ja:'含まれるもの',    zh:'包含项' },
    'admin.pn.excluded':        { ko:'불포함 사항',    en:'Excluded',        ja:'含まれないもの',  zh:'不包含' },
    'admin.pn.pricing':         { ko:'가격',           en:'Pricing',         ja:'価格',           zh:'价格' },
    'admin.pn.priceIn':         { ko:'$1 단위 가격',   en:'Price in $1',     ja:'$1単位の価格',    zh:'$1 单位价格' },
    'admin.pn.availability':    { ko:'예약 가능',      en:'Availability',    ja:'予約可能期間',    zh:'可预订期' },
    'admin.pn.from':            { ko:'시작',           en:'From',            ja:'開始',           zh:'起' },
    'admin.pn.to':              { ko:'종료',           en:'To',              ja:'終了',           zh:'止' },
    'admin.pn.min':             { ko:'최소 인원',      en:'Min guests',      ja:'最少人数',       zh:'最少人数' },
    'admin.pn.max':             { ko:'최대 인원',      en:'Max guests',      ja:'最大人数',       zh:'最多人数' },
    'admin.pn.visibility':      { ko:'노출 설정',      en:'Visibility',      ja:'表示設定',       zh:'可见性' },
    'admin.pn.liveOnShop':      { ko:'쇼에 노출',      en:'Live on shop',    ja:'ショップ公開',    zh:'在商店上线' },
    'admin.pn.liveDesc':        { ko:'유저에게 보입니다', en:'Users can see this product', ja:'ユーザーに表示されます', zh:'用户可见此商品' },
    'admin.pn.featuredFlag':    { ko:'추천',           en:'Featured',        ja:'おすすめ',       zh:'精选' },
    'admin.pn.featuredDesc':    { ko:'홈에 표시',      en:'Show on home page',ja:'ホームに表示',  zh:'在首页显示' },

    'admin.bk.kicker':          { ko:'운영',           en:'Operations',      ja:'運用',           zh:'运营' },
    'admin.bk.title':           { ko:'예약 관리',      en:'Bookings',        ja:'予約管理',       zh:'预订管理' },
    'admin.bk.searchPh':        { ko:'예약 번호 또는 지갑 주소로 검색...', en:'Search booking ID or wallet...', ja:'予約番号・ウォレットで検索...', zh:'按预订编号或钱包搜索…' },
    'admin.bk.userWallet':      { ko:'유저 지갑',      en:'User Wallet',     ja:'ユーザーウォレット',zh:'用户钱包' },
    'admin.bk.bookingId':       { ko:'예약 번호',      en:'Booking ID',      ja:'予約番号',       zh:'预订编号' },

    'admin.pay.kicker':         { ko:'재무',           en:'Finance',         ja:'財務',           zh:'财务' },
    'admin.pay.title':          { ko:'결제 관리',      en:'Payments',        ja:'決済管理',       zh:'支付管理' },
    'admin.pay.confirmed':      { ko:'확정 결제 합계', en:'Confirmed payments', ja:'確定済み決済', zh:'已确认支付' },
    'admin.pay.refunded':       { ko:'환불 합계',      en:'Refunded',        ja:'返金合計',       zh:'退款合计' },
    'admin.pay.txcount':        { ko:'트랜잭션 수',    en:'Tx count',        ja:'取引数',         zh:'交易数' },
    'admin.pay.txHash':         { ko:'트랜잭션 해시',  en:'Tx Hash',         ja:'TxHash',         zh:'交易哈希' },

    'admin.usr.kicker':         { ko:'커뮤니티',       en:'Community',       ja:'コミュニティ',    zh:'社区' },
    'admin.usr.title':          { ko:'회원 관리',      en:'Users',           ja:'ユーザー管理',    zh:'用户管理' },
    'admin.usr.walletAddr':     { ko:'지갑 주소',      en:'Wallet Address',  ja:'ウォレットアドレス',zh:'钱包地址' },
    'admin.usr.totalBookings':  { ko:'총 예약수',      en:'Total bookings',  ja:'予約合計',       zh:'预订总数' },
    'admin.usr.totalPaid':      { ko:'총 결제액',      en:'Total paid',      ja:'支払い合計',     zh:'支付总额' },
    'admin.usr.joined':         { ko:'가입일',         en:'Joined',          ja:'登録日',         zh:'加入时间' },

    'admin.bn.kicker':          { ko:'마케팅',         en:'Marketing',       ja:'マーケティング',  zh:'营销' },
    'admin.bn.title':           { ko:'배너 관리',      en:'Banners',         ja:'バナー管理',     zh:'横幅管理' },
    'admin.bn.order':           { ko:'순서',           en:'Order',           ja:'並び順',         zh:'排序' },
    'admin.bn.link':            { ko:'링크',           en:'Link',            ja:'リンク',         zh:'链接' },
    'admin.bn.confirmDel':      { ko:'배너를 삭제할까요?', en:'Delete banner?', ja:'バナーを削除しますか？', zh:'确定删除该横幅？' },
    'admin.bn.addNew':          { ko:'새 배너 추가',   en:'Add new banner',  ja:'新バナーを追加',  zh:'添加新横幅' },
    'admin.bn.btnText':         { ko:'버튼 텍스트',    en:'Button text',     ja:'ボタンテキスト',  zh:'按钮文字' },
    'admin.bn.btnLink':         { ko:'버튼 링크',      en:'Button link',     ja:'ボタンリンク',    zh:'按钮链接' },

    'admin.st.kicker':          { ko:'설정',           en:'Configuration',   ja:'構成',           zh:'配置' },
    'admin.st.title':           { ko:'설정 관리',      en:'Settings',        ja:'設定',           zh:'设置' },
    'admin.st.account':         { ko:'관리자 계정',    en:'Admin account',   ja:'管理者アカウント',zh:'管理员账户' },
    'admin.st.newPw':           { ko:'새 비밀번호',    en:'New password',    ja:'新しいパスワード',zh:'新密码' },
    'admin.st.payment':         { ko:'결제 설정',      en:'Payment',         ja:'決済設定',       zh:'支付设置' },
    'admin.st.recvWallet':      { ko:'수신 지갑 (TON)',en:'Receiving wallet (TON)',ja:'受取ウォレット (TON)',zh:'收款钱包 (TON)' },
    'admin.st.platformFee':     { ko:'플랫폼 수수료',  en:'Platform fee',    ja:'プラットフォーム手数料',zh:'平台手续费' },
    'admin.st.allowedToken':    { ko:'허용 토큰',      en:'Allowed token',   ja:'許可トークン',    zh:'允许的代币' },
    'admin.st.tokenLocked':     { ko:'고정',           en:'Locked',          ja:'固定',           zh:'锁定' },
    'admin.st.site':            { ko:'사이트 정보',    en:'Site',            ja:'サイト情報',     zh:'站点信息' },
    'admin.st.siteName':        { ko:'사이트명',       en:'Site name',       ja:'サイト名',       zh:'站点名称' },
    'admin.st.slogan':          { ko:'슬로건',         en:'Slogan',          ja:'スローガン',     zh:'口号' },
  };

  function getLang() {
    let l = localStorage.getItem(STORAGE_KEY);
    if (!SUPPORTED.includes(l)) {
      const n = (navigator.language || 'en').toLowerCase();
      l = n.startsWith('ko') ? 'ko' : n.startsWith('ja') ? 'ja' : (n.startsWith('zh') ? 'zh' : 'en');
    }
    return l;
  }
  function setLang(l) {
    if (!SUPPORTED.includes(l)) return;
    localStorage.setItem(STORAGE_KEY, l);
    window.__DT_LANG = l;
    document.documentElement.setAttribute('lang', l);
    applyDom();
    window.dispatchEvent(new CustomEvent('dt:lang', { detail: l }));
  }
  function t(key, fallback) {
    const lang = window.__DT_LANG || getLang();
    const row = DICT[key];
    if (!row) return fallback != null ? fallback : key;
    return row[lang] || row.en || row.ko || key;
  }

  function applyDom() {
    // [data-i18n] textContent (use innerHTML for keys flagged i18n-html)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const v = t(key);
      if (el.hasAttribute('data-i18n-html')) el.innerHTML = v;
      else el.textContent = v;
    });
    // [data-i18n-placeholder]
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    // [data-i18n-attr] format: "attr:key,attr:key"
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.getAttribute('data-i18n-attr').split(',').forEach(pair => {
        const [a, k] = pair.split(':');
        if (a && k) el.setAttribute(a, t(k));
      });
    });
    // Sync the lang switcher labels (current value)
    document.querySelectorAll('[data-dt-lang-current]').forEach(el => {
      el.textContent = LANG_SHORT[window.__DT_LANG || getLang()];
    });
  }

  // Lang switcher UI: a capsule button that pops a small glass menu
  function langSwitcherHTML() {
    const cur = window.__DT_LANG || getLang();
    return `
      <div class="dt-lang" id="dtLang">
        <button class="dt-lang-btn" onclick="window.__dtLang.toggleMenu()" aria-haspopup="true">
          <span class="dt-lang-globe" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/>
            </svg>
          </span>
          <span data-dt-lang-current>${LANG_SHORT[cur]}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="dt-lang-menu glass-card" role="menu">
          ${SUPPORTED.map(l => `
            <button class="dt-lang-item ${l===cur?'is-active':''}" data-lang="${l}" onclick="window.__dtLang.choose('${l}')">
              <span>${LANG_LABELS[l]}</span>
              <span class="dt-lang-short">${LANG_SHORT[l]}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function mountSwitchers() {
    document.querySelectorAll('[data-dt-lang-mount]').forEach(host => {
      host.innerHTML = langSwitcherHTML();
    });
  }

  function toggleMenu() {
    const el = document.getElementById('dtLang');
    if (el) el.classList.toggle('is-open');
  }
  function choose(l) {
    setLang(l);
    mountSwitchers();
    const el = document.getElementById('dtLang');
    if (el) el.classList.remove('is-open');
  }

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    const el = document.getElementById('dtLang');
    if (!el) return;
    if (!el.contains(e.target)) el.classList.remove('is-open');
  });

  // Expose
  window.__dtLang = { t, getLang, setLang, applyDom, mountSwitchers, toggleMenu, choose, SUPPORTED, LANG_LABELS, LANG_SHORT };
  window.t = t;

  // Init early so SPA renderers can read t()
  window.__DT_LANG = getLang();
  document.documentElement.setAttribute('lang', window.__DT_LANG);

  // On DOM ready: apply static dom + mount switchers
  document.addEventListener('DOMContentLoaded', () => {
    mountSwitchers();
    applyDom();
  });
})();
