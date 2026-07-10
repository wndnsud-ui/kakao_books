document.addEventListener("DOMContentLoaded", function() {

    // 1. 메인 페이지용: 검색 버튼 기능
    window.searchBooks = function() {
        let query = document.getElementById("searchInput").value.trim();
        if (query === "") {
            const randomChar = ['가','나','다','라','마','바','사','아','자','차','카','타','파','하'];
            query = randomChar[Math.floor(Math.random() * randomChar.length)];
        }
        window.location.href = `search.html?query=${encodeURIComponent(query)}`;
    };

    // 2. 결과 페이지용: 데이터 가져오기 함수
    window.fetchBooksFromURL = async function(query) {
        const REST_API_KEY = "f2f2e20b9c2bd1cf3bbf95a52a744fed";
        const bookList = document.getElementById("booklist");
        if (!bookList) return;

        // 👇👇👇 메인 페이지를 지키기 위해, 검색 페이지일 때만 JS로 강제 바둑판 변신! 👇👇👇
        bookList.style.display = 'grid';
        bookList.style.gridTemplateColumns = 'repeat(4, 1fr)';
        bookList.style.gap = '20px';
        bookList.style.flexWrap = 'unset'; // 스와이퍼 flex 속성과의 충돌 완벽 차단
        // 👆👆👆 여기까지 추가 👆👆👆



        bookList.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">도서를 불러오는 중입니다...</p>';
        
        try {
            const response = await fetch(`https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(query)}&size=12`, {
                method: 'GET',
                headers: { 'Authorization': `KakaoAK ${REST_API_KEY}` }
            });
            if (!response.ok) throw new Error('네트워크 응답 에러');
            const data = await response.json();
            const books = data.documents;

            if (books.length === 0) {
                bookList.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">검색결과가 없어요.</p>';
                return;
            }

            bookList.innerHTML = ''; 
            books.forEach(book => {
                const card = document.createElement('div');
                card.className = 'book-card';
                const thumbnailSrc = book.thumbnail ? book.thumbnail : 'https://via.placeholder.com/120x170?text=No+Img';
                const authorsName = book.authors.length > 0 ? book.authors.join('. ') : '저자미상';
                const formattedPrice = book.sale_price > 0 ? `${book.sale_price.toLocaleString()}원` : '가격미정';

                card.innerHTML = `
                    <img class="book-thumbnail" src="${thumbnailSrc}" alt="${book.title} 표지">
                    <div class="book-title" title="${book.title}">${book.title}</div>
                    <div class="book-authors">${authorsName}</div>
                    <div class="book-price">${formattedPrice}</div>
                `;
                card.style.cursor = 'pointer';
                card.onclick = () => window.open(book.url, '_blank');
                bookList.appendChild(card);
            });
        } catch (error) {
            console.log('에러상세: ', error);
            bookList.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">데이터 로딩중 에러발생</p>';
        }
    };

// 3. 지정 도서(ISBN) 불러오기 (메인 페이지 전용 모모슬 큐레이션)
    
    // [목표 1] 내가 보여주고 싶은 책 7권의 ISBN 넘버를 미리 배열(리스트)로 만들어 둡니다.
    const TARGET_ISBNS = [
        "9788965132288", // 1. 어떻게 살 것인가
        "9788937460586", // 2.싯다르타
        "9791141609597", // 3.몸, 내 안의 우주: 응급의학과 의사가 들려주는 의학교양
        "9788934942467", // 4.총균쇠
        "9791193262658", // 5.다정함이 이긴다
        "9791170873068", // 6.에디터의 기록법 읽고 싶은 콘텐츠를 만드는 에디터 10인의 노트
        "9791193482124"  // 7.청킹맨션의 보스는 알고 있다
        ];

    // [목표 2] 카카오 API에서 책 정보를 가져와서 화면에 그리는 메인 함수입니다.
async function loadCuratedBooks() {
        const bookList = document.getElementById("booklist");
        if (!bookList || window.location.pathname.includes('search.html')) return;

        bookList.innerHTML = '';

        try {
            const fetchPromises = TARGET_ISBNS.map(async (isbn) => {
                const response = await fetch(`https://dapi.kakao.com/v3/search/book?target=isbn&query=${isbn}`, {
                    method: 'GET',
                    headers: { 'Authorization': 'KakaoAK f2f2e20b9c2bd1cf3bbf95a52a744fed' }
                });
                const data = await response.json();
                return data.documents[0]; 
            });

            const books = await Promise.all(fetchPromises);

            books.forEach(book => {
                if (!book) return; 

                const card = document.createElement('div');
                
                // ✅ 첫 번째 핵심: 스와이퍼가 인식하게 'swiper-slide' 클래스 추가
                card.className = 'swiper-slide book-card'; 
                
                const thumbnailSrc = book.thumbnail ? book.thumbnail : 'https://via.placeholder.com/120x170?text=No+Img';
                const authorText = book.authors.length > 0 ? `${book.authors.join(', ')} 글` : '저자 미상';
                const publisherText = book.publisher ? ` | ${book.publisher}` : '';
                const formattedPrice = book.sale_price > 0 ? `${book.sale_price.toLocaleString()}원` : '가격 미정';

                card.innerHTML = `
                    <img src="${thumbnailSrc}" alt="${book.title}" class="book-thumbnail">
                    <p class="book-category">📚모모슬 추천</p>
                    <p class="book-title">${book.title}</p>
                    <p class="book-authors">${authorText}${publisherText}</p>
                    <p class="book-price">${formattedPrice}</p>
                `;

                card.style.cursor = 'pointer';
                card.onclick = () => window.open(book.url, '_blank');

                bookList.appendChild(card);
            });

            // ✅ 두 번째 핵심: 책 카드를 다 그려낸 후, 스와이퍼(모터)를 작동시킵니다.
            new Swiper('.recommendSwiper', {
                slidesPerView: 4, // 한 화면에 4개씩 보여주기
                spaceBetween: 20, // 카드 사이 간격
                loop: true,       // 무한 반복 (7권 끝나면 다시 1번으로)
                autoplay: {
                    delay: 3000,  // 3초마다 자동으로 넘어가기
                    disableOnInteraction: false,
                },
            });

        } catch (e) { 
            console.error("지정 도서 로드 실패:", e); 
        }
    }

    loadCuratedBooks();

// 여기까지 랜덤 함수임 

    // 4. Swiper 초기화
    var swiper = new Swiper('.mySwiper', {
        spaceBetween: 30,
        centeredSlides: true,
        autoplay: { delay: 2500, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    });

    // 5. 하단 탭 클릭 스타일 전환
    const tabs = document.querySelectorAll(".event-tabs-wrapper .tab");
    if (tabs.length > 0) tabs[0].classList.add("active");
    tabs.forEach(tab => {
        tab.addEventListener("click", function() {
            tabs.forEach(t => t.classList.remove("active"));
            this.classList.add("active");
        });
    });
});