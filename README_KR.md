# 함께하는 75민턴 뮤직앨범 PWA

## 파일 구성
- `index.html` : 메인 플레이어
- `manifest.json` : PWA 설치 정보
- `sw.js` : 서비스 워커
- `icons/` : 앱 아이콘

## GitHub Pages 배포 방법
1. GitHub에서 새 저장소를 만듭니다. 예: `75minton-pwa`
2. 이 폴더 안의 파일을 저장소 루트에 업로드합니다.
3. 저장소의 **Settings > Pages** 로 이동합니다.
4. **Build and deployment** 에서 **Deploy from a branch** 를 선택합니다.
5. Branch는 `main`, Folder는 `/ (root)` 를 선택하고 저장합니다.
6. 수 분 뒤 아래 형식의 주소로 접속합니다.  
   `https://<깃허브아이디>.github.io/<저장소이름>/`

## 로컬 테스트
브라우저에서 더블클릭으로 여는 대신, 간단한 로컬 서버를 사용하세요.

### Python
```bash
python -m http.server 8000
```

그 다음 브라우저에서:
```text
http://localhost:8000
```

## 음악 파일 관련
현재 플레이어는 `raw.githubusercontent.com` 에 있는 음원/커버/LRC를 불러옵니다.  
더 안정적인 오프라인 캐시를 원하면 이 저장소 안에 `assets/` 폴더를 만들고,
음원과 이미지, LRC 파일을 같은 저장소에 함께 넣은 뒤 경로를 상대경로로 바꾸는 것을 권장합니다.

## 커스터마이징
`index.html` 안의 `songs` 배열에서 제목, 아티스트, 커버, mp3, lrc 주소를 바꾸면 됩니다.
