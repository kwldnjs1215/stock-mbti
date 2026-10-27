-- 테스트 결과 저장 테이블
CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,          -- 예: ATDO
  scores TEXT NOT NULL,        -- 축별 a 글자 비율, 예: [60,80,60,60]
  answers TEXT NOT NULL,       -- 문항별 선택, 예: ABBA... (20글자)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_results_type ON results (type);
CREATE INDEX IF NOT EXISTS idx_results_created ON results (created_at);
