window.addEventListener('DOMContentLoaded', () => {
    console.log("HTML이 모두 로드되었습니다. 이제 데이터 요청을 시작합니다.");
    fetchBookInfo();
});

// 1. [기본 설정 변수] 프로그램에서 계속 재사용할 데이터들을 상자에 담아둡니다.
const REST_API_KEY = "f2f2e20b9c2bd1cf3bbf95a52a744fed"; // 👉 카카오 서비스를 사용하기 위한 출입증(키)입니다.
const SEARCH_QUERY = "다정한 사람이 이긴다"; // 👉 카카오 책 검색창에 입력할 검색어입니다.
let salePrice = 0; // 👉 책의 최종 할인가를 저장할 빈 상자입니다. (아래 여러 함수에서 함께 사용하려고 맨 위에 둡니다.)


// 2. [네트워크 통신 함수] 인터넷(카카오 서버)을 통해 데이터를 원격으로 가져오는 비행기 역할을 합니다.
async function fetchBookInfo(){ // 👉 async: "인터넷에서 데이터를 받아올 때까지 기다려줄 수 있는 특수 함수"로 지정합니다.
    // 👉 encodeURIComponent: 검색어에 한글이나 공백이 있으면 인터넷 주소창이 인식하지 못하므로, 주소용 언어로 변환(인코딩)해줍니다.
    const url = `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(SEARCH_QUERY)}`;

    try { // 👉 try: "일단 아래 코드를 실행해봐!"라는 뜻입니다. (네트워크 연결 끊김 등의 에러를 방지하는 울타리)
        
        // 👉 fetch: 실제로 지정한 url(인터넷 주소)로 데이터를 달라고 요청을 보냅니다.
        // 👉 await: 인터넷을 통해 응답이 올 때까지 다음 줄로 넘어가지 않고 잠시 대기합니다.
        const response = await fetch(url, {
            method: "GET", // 👉 GET: 데이터를 '가져오겠다'는 목적의 요청 종류입니다.
            headers: { // 👉 headers: 카카오 서버에게 내 출입증(키)을 보여주는 가방입니다.
                "Authorization": `KakaoAK ${REST_API_KEY}` // 👉 "나 카카오 개발자고, 내 키는 이거야"라고 증명하는 규칙입니다.
            }
        });

        // 👉 !response.ok: 카카오 서버가 응답을 거절했거나 주소가 틀려서 실패했다면?
        if(!response.ok){
            throw new Error("API 요청이 실패했어요"); // 👉 의도적으로 에러를 발생시켜 catch 블록으로 점프합니다.
        }

        // 👉 response.json(): 서버에서 받아온 가공되지 않은 뭉텅이 데이터를 자바스크립트가 읽기 편한 '객체(Object)' 형태로 변환합니다.
        const data = await response.json();

        // 👉 data.documents: 카카오가 보내준 검색 결과 리스트(배열)가 실제로 존재하고, 갯수가 0개보다 많은지 확인합니다.
        if (data.documents && data.documents.length > 0) {
            // 👉 가장 첫 번째로 검색된 책 데이터(index 0번) 한 권을 뽑아서 화면에 뿌리는 함수(renderBookInfo)로 전달합니다.
            renderBookInfo(data.documents[0]);
        } else {
            // 👉 검색 결과가 없다면 화면의 제목 칸을 '검색 결과가 없어요'로 교체합니다.
            document.getElementById('book-title').innerText = '검색 결과가 없어요.';
        }

    } catch(error) { // 👉 catch: try 블록 내부에서 인터넷이 끊기거나 오타로 에러가 나면 일로 튕겨져 들어옵니다.
        console.log("에러 발생", error); // 👉 개발자 도구 콘솔창에 어떤 에러인지 기록을 남깁니다.
        document.getElementById('book-title').innerText = '데이터를 가져오지 못했어요.';        
    }
}


// 3. [화면 바인딩 함수] 카카오에서 받은 책 데이터를 HTML 문서 구멍구멍마다 쏙쏙 박아주는 역할을 합니다.
function renderBookInfo(book){
    console.log(book); // 👉 카카오가 보내준 책 데이터 전체 구조를 개발자 도구 콘솔창에 찍어서 눈으로 확인해봅니다.
    
    // 👉 삼항 연산자: book.sale_price(할인가)가 0보다 크면 할인가를 사용하고, 세일이 안 들어가서 0원이면 book.price(정가)를 salePrice 변수에 저장합니다.
    salePrice = book.sale_price > 0 ? book.sale_price : book.price;
    
    // 👉 카카오 도서 이미지는 기본적으로 저화질 주소로 옵니다. 고화질로 바꾸기 위해 가공 처리를 시작합니다.
    let originalThumbnail = book.thumbnail;
    // 👉 이미지 주소 내부에 특정 문자열('/thumb/R120x174...')이 포함되어 있는지 확인합니다.
    if(originalThumbnail && originalThumbnail.includes('/thumb/R120x174.q85/?fname=')){
        // 👉 '?fname='을 기준으로 주소를 쪼갠 뒤 뒤쪽 진짜 이미지 주소만 추출해서 원본 고화질 주소로 변환합니다.
        originalThumbnail = decodeURIComponent(originalThumbnail.split('?fname=')[1]);
    }
    // 👉 HTML의 <img> 태그(id="book-thumbnail")를 찾아서 이미지 주소(src)를 넣어 화면에 이미지를 띄웁니다. 만약 이미지가 없다면 준비된 placeholder 대체 이미지를 띄웁니다.
    document.getElementById('book-thumbnail').src = originalThumbnail || "https://placehold.co/150x220?text=no+Image";

    // 👉 HTML의 제목 칸(id="book-title")을 찾아서 책 제목(book.title)으로 글자를 바꿉니다.
    document.getElementById('book-title').innerText = book.title;
    
    // 👉 책 소개 글(contents)이 존재하면 앞글자부터 딱 70글자까지만 자르고 뒤에 '...'을 붙이고, 소개 글이 아예 비어있으면 대체 문구를 화면에 채웁니다.
    document.getElementById('book-contents').innerText = book.contents 
        ? book.contents.substring(0,220) + "..." 
        : "사람을 남기는 말, 관계를 바꾸는 태도";

    // 👉 book.authors는 배열(['홍길동', '이순신']) 형태이므로 .join(', ')을 사용해 "홍길동, 이순신" 형태의 하나의 문자열로 묶어줍니다.
    const authors = book.authors.join(', ');
    const publisher = book.publisher; // 👉 출판사 이름을 변수에 담습니다.
    const isbn = book.isbn.split(' ')[0]; // 👉 ISBN 번호가 여러 개 묶여서 올 수 있으므로 공백 기준으로 잘라 첫 번째 번호만 가져옵니다.
    
    // 👉 HTML의 정보 칸(id="book-meta")을 찾아서 "저자 아무개 | 무슨출판사 | ISBN:12345" 형태의 긴 텍스트를 집어넣습니다.
    document.getElementById('book-meta').innerText = `저자 ${authors} | ${publisher} | ISBN:${isbn}`;

    // 👉 toLocaleString(): 숫자 15000을 15,000처럼 세 자리마다 콤마(,)가 찍히게 만들어주는 고마운 함수입니다.
    document.getElementById("price-original").innerText = `${book.price.toLocaleString()}원`; // 👉 정가 칸에 대입
    document.getElementById("price-sale").innerText = `${salePrice.toLocaleString()}원`; // 👉 할인가 칸에 대입    

    // 👉 책 정보가 화면에 다 그려졌으니, 최초 1개를 주문했을 때의 합계 금액을 계산하라고 아래 4번 함수를 호출(명령)합니다.
    updateTotalPrice(1);
}


// 4. [금액 계산 함수] (수량 * 할인 가격)을 계산해서 합계 금액 칸을 새로고침해 주는 계산기입니다.
function updateTotalPrice(quantity){
    const totalAmountEl = document.getElementById('total-amount'); // 👉 HTML의 합계 칸(id="total-amount")을 변수에 담아둡니다.
    const total = salePrice * quantity; // 👉 (책의 할인 가격 × 주문 수량)을 수학 연산하여 합산 금액을 구합니다.
    totalAmountEl.innerText = `${total.toLocaleString()}원`; // 👉 구해진 합계 금액에 콤마(,)를 찍어서 HTML 화면에 글자로 채워 넣습니다.
}   
    

// 5. [수량 조절 함수] 사용자가 화면의 + 버튼이나 - 버튼을 누를 때 실행되는 함수입니다.
function changeQuantity(delta) { // 👉 delta 자리에 +1 또는 -1이라는 숫자가 들어옵니다.
    const qty = document.getElementById('quantity'); // 👉 HTML의 수량 입력창(id="quantity", <input> 태그)을 가져옵니다.
    console.log(qty); // 👉 가져온 input 태그 객체가 정상인지 콘솔에 찍어봅니다.
    let currentQty = parseInt(qty.value); // 👉 현재 입력창에 써진 수량 문자열(예: "1")을 연산이 가능하도록 실제 정수(숫자 1)로 변환합니다.

    currentQty += delta; // 👉 현재 수량에 넘어온 값(+1 또는 -1)을 더하거나 뺍니다. (예: 1 + 1 = 2)
    if(currentQty < 1) currentQty = 1; // 👉 만약 빼다가 0이나 마이너스가 되면, 수량은 무조건 최소 1개로 고정되도록 방어벽을 칩니다.

    qty.value = currentQty; // 👉 계산 완료된 새로운 수량 숫자를 다시 화면의 입력창 글자로 되돌려 놓습니다.
    updateTotalPrice(currentQty); // 👉 수량이 바뀌었으니 총합 금액도 다시 계산하라고 4번 함수를 호출하며 새로운 수량을 넘겨줍니다.
}


// 🚀 [시동 걸기] 자동차 키를 돌리듯 프로그램의 첫 단추인 2번 함수를 전격 실행합니다.
fetchBookInfo();

/* ==========================================================================
   [추가됨] 검색 서비스 관련 기능
   ========================================================================== */

// 1. 검색 버튼 클릭 시 실행될 함수
// HTML에서 onclick="searchBooks()"로 호출됩니다.
function searchBooks() {
    const searchInput = document.getElementById("searchInput");
    const query = searchInput.value.trim();

    if (query === "") {
        alert("검색어를 입력해주세요.");
        return;
    }

    // [중요] 상세 페이지(project_1.html)가 아닌 별도의 검색 결과 페이지로 검색어를 넘깁니다.
    // 만약 한 페이지에서 검색 결과를 바로 보여주고 싶다면 구조가 완전히 달라져야 합니다.
    window.location.href = `search.html?query=${encodeURIComponent(query)}`;
}

// 2. 검색 결과 페이지용 함수 (search.html에서 호출)
// 이 함수는 search.html 페이지에 <div id="booklist"></div>가 있을 때 실행됩니다.
async function fetchBooksFromURL(query) {
    const REST_API_KEY = "f2f2e20b9c2bd1cf3bbf95a52a744fed";
    const bookList = document.getElementById("booklist");
    
    if (!bookList) return; // 상세 페이지에서는 이 함수가 실행되지 않게 막음

    bookList.innerHTML = '<p>도서를 검색 중입니다...</p>';
    
    try {
        const response = await fetch(`https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(query)}&size=12`, {
            method: 'GET',
            headers: { 'Authorization': `KakaoAK ${REST_API_KEY}` }
        });

        const data = await response.json();
        const books = data.documents;

        if (books.length === 0) {
            bookList.innerHTML = '<p>검색 결과가 없습니다.</p>';
            return;
        }

        bookList.innerHTML = ''; 
        books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.innerHTML = `
                <img src="${book.thumbnail || 'https://via.placeholder.com/120x170'}" alt="표지">
                <div class="book-title">${book.title}</div>
                <div class="book-price">${book.sale_price > 0 ? book.sale_price.toLocaleString() : '가격미정'}원</div>
            `;
            card.onclick = () => window.open(book.url, '_blank');
            bookList.appendChild(card);
        });
    } catch (error) {
        console.error("검색 에러:", error);
        bookList.innerHTML = '<p>검색 중 오류가 발생했습니다.</p>';
    }
}