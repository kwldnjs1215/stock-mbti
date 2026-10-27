# 동학개미 MBTI

20문항으로 알아보는 투자 성향 테스트. 결과는 조선시대 개미 16가지 유형으로 나옵니다. Cloudflare Pages + D1로 배포합니다.

```
public/                 정적 사이트 (index.html, style.css, data.js, characters.js, app.js)
functions/api/results.js  POST /api/results — 결과를 D1에 저장
schema.sql              D1 테이블
wrangler.toml           Pages + D1 설정
```

## 처음 배포하기

1. Cloudflare 로그인

   ```bash
   npx wrangler login
   ```

2. D1 데이터베이스 만들기. 출력되는 `database_id`를 `wrangler.toml`에 붙여넣습니다.

   ```bash
   npx wrangler d1 create donghak-mbti
   ```

3. 테이블 만들기 (배포용 원격 DB)

   ```bash
   npx wrangler d1 execute donghak-mbti --remote --file=schema.sql
   ```

4. Pages 프로젝트 만들고 배포

   ```bash
   npx wrangler pages project create donghak-mbti --production-branch=main
   ```

   ```bash
   npx wrangler pages deploy
   ```

   배포가 끝나면 `https://donghak-mbti.pages.dev` 같은 주소가 나옵니다.
   `wrangler.toml`의 D1 설정이 Pages 프로젝트에 같이 적용됩니다.

## 로컬에서 API까지 같이 돌려보기

```bash
npx wrangler d1 execute donghak-mbti --local --file=schema.sql
```

```bash
npx wrangler pages dev
```

## 저장된 결과 보기

```bash
npx wrangler d1 execute donghak-mbti --remote --command="SELECT type, COUNT(*) AS n FROM results GROUP BY type ORDER BY n DESC"
```

```bash
npx wrangler d1 execute donghak-mbti --remote --command="SELECT name, type, created_at FROM results ORDER BY id DESC LIMIT 20"
```

> 문항 수를 바꾸면 `functions/api/results.js`의 `ANSWERS_RE`(지금은 20글자)도 같이 바꿔주세요.

> 화면 파일(style.css, data.js, characters.js, app.js)을 고친 뒤 다시 배포할 때는 `public/index.html`의 `?v=2` 숫자를 하나 올려주세요. 그래야 이미 방문한 사람도 옛날 파일 대신 새 파일을 받습니다.
