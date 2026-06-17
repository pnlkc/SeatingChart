import { useState, useMemo, useRef, useEffect } from 'react';
import './App.css';
import rawSeatingData from './seatingData.json';

// 배치도/약도 전용 모던 플랫 SVG 아이콘 컴포넌트
function AreaIcon({ name, size = 18 }) {
  if (name.includes('엘리베이터')) {
    // 엘리베이터 (위아래 화살표 + 도어 박스)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cell-icon">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="m9 10 3-3 3 3" />
        <path d="m9 14 3 3 3-3" />
      </svg>
    );
  }
  if (name.includes('계단') || name.includes('비상구')) {
    // 비상구 (문 프레임 + 탈출 화살표)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cell-icon">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="14 5 19 7 19 17 14 19" />
        <path d="M6 12h8" />
        <path d="m11 9 3 3-3 3" />
      </svg>
    );
  }
  if (name.includes('화장실')) {
    // 화장실 (남성/여성 젠더 심볼 기반 픽토그램)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cell-icon">
        <circle cx="12" cy="5" r="2" />
        <path d="M9 22V12H7V8c0-1.1.9-2 2-2h6a2 2 0 0 1 2 2v4h-2v10H9z" />
      </svg>
    );
  }
  if (name.includes('오아시스')) {
    // 오아시스 휴게구역 (커피 컵)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cell-icon">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" x2="6" y1="2" y2="4" />
        <line x1="10" x2="10" y1="2" y2="4" />
        <line x1="14" x2="14" y1="2" y2="4" />
      </svg>
    );
  }
  if (name.includes('회의 공간') || name.includes('세미나실')) {
    // 회의실 (회의 데스크 & 인원 브리핑 스크린)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cell-icon">
        <rect width="18" height="12" x="3" y="3" rx="2" />
        <path d="M2 17h20" />
        <path d="M12 17v4" />
        <path d="M9 21h6" />
      </svg>
    );
  }
  if (name.includes('사용불가') || name.includes('LUNA')) {
    // 경고 / 제한 구역 (금지 심볼)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cell-icon">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" x2="19.07" y1="4.93" y2="19.07" />
      </svg>
    );
  }
  return null;
}

export default function App() {
  const floors = useMemo(() => Object.keys(rawSeatingData), []);
  const [activeFloor, setActiveFloor] = useState('3F');
  const [activeZone, setActiveZone] = useState('C5');

  const activeFloorRef = useRef(activeFloor);
  const activeZoneRef = useRef(activeZone);

  useEffect(() => {
    activeFloorRef.current = activeFloor;
  }, [activeFloor]);

  useEffect(() => {
    activeZoneRef.current = activeZone;
  }, [activeZone]);

  const [isLightTheme, setIsLightTheme] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('light-theme', isLightTheme);
  }, [isLightTheme]);

  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const mapViewportRef = useRef(null);

  // 모바일 여부 감지 (matchMedia 기반, 화면 회전/리사이즈 대응)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // 모바일 줌 상태 정의 (60% ~ 200%)
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(zoom);
  const touchCenterRef = useRef({ relativeX: 0, relativeY: 0, contentX: 0, contentY: 0 });

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // 층/구역 전환 시 줌 100% 초기화
  useEffect(() => {
    setZoom(1);
  }, [activeFloor, activeZone]);

  // 모바일 브라우저 자체 줌(핀치 줌, 더블 탭 줌) 방지
  useEffect(() => {
    if (!isMobile) return;

    const preventDefaultZoom = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchstart', preventDefaultZoom, { passive: false });
    document.addEventListener('touchmove', preventDefaultZoom, { passive: false });
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventDefaultZoom);
      document.removeEventListener('touchmove', preventDefaultZoom);
      document.removeEventListener('touchend', preventDoubleTapZoom);
    };
  }, [isMobile]);

  // 배치도 내부 영역(mapViewport)에서의 핀치 줌 제어 (터치 중앙 기준점 추적 및 스크롤 자동 보정 적용)
  useEffect(() => {
    const viewport = mapViewportRef.current;
    if (!viewport || !isMobile) return;

    let startDist = 0;
    let startZoom = 1;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        startDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        startZoom = zoomRef.current;

        // 두 터치 지점의 중간값(중앙좌표) 계산
        const rect = viewport.getBoundingClientRect();
        const centerX = (t1.clientX + t2.clientX) / 2;
        const centerY = (t1.clientY + t2.clientY) / 2;

        // 뷰포트 상대적 오프셋 계산
        const relativeX = centerX - rect.left;
        const relativeY = centerY - rect.top;

        // 줌 배율이 1일 때 기준의 절대 콘텐츠 내 상대좌표(Pivot) 계산 보관
        const contentX = (viewport.scrollLeft + relativeX) / startZoom;
        const contentY = (viewport.scrollTop + relativeY) / startZoom;

        touchCenterRef.current = { relativeX, relativeY, contentX, contentY };
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && startDist > 0) {
        e.preventDefault(); // 기본 브라우저 줌/스크롤 제어 차단
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const scale = dist / startDist;

        let newZoom = startZoom * scale;
        // 최소 60%, 최대 200% 범위 제한
        newZoom = Math.min(Math.max(newZoom, 0.6), 2.0);
        newZoom = Math.round(newZoom * 100) / 100;

        if (newZoom !== zoomRef.current) {
          setZoom(newZoom);

          // 핀치 줌 중앙 좌표(Anchor)가 뷰포트 화면상 제자리에 계속 머물도록 스크롤 오프셋 정밀 보정
          const { relativeX, relativeY, contentX, contentY } = touchCenterRef.current;
          const targetScrollLeft = contentX * newZoom - relativeX;
          const targetScrollTop = contentY * newZoom - relativeY;

          viewport.scrollLeft = targetScrollLeft;
          viewport.scrollTop = targetScrollTop;
        }
      }
    };

    const handleTouchEnd = () => {
      startDist = 0;
    };

    viewport.addEventListener('touchstart', handleTouchStart, { passive: true });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      viewport.removeEventListener('touchstart', handleTouchStart);
      viewport.removeEventListener('touchmove', handleTouchMove);
      viewport.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile]);

  // 모바일 좌우 스크롤 상태 감지
  const [scrollIndicators, setScrollIndicators] = useState({
    left: false,
    right: false
  });

  const scrollTickingRef = useRef(false);

  const checkScrollIndicators = () => {
    const el = mapViewportRef.current;
    if (!el) return;
    const canScrollLeft = el.scrollLeft > 1;
    const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;

    // 상태 변화가 실제로 일어났을 때만 리렌더링하도록 bailout 방어 처리
    setScrollIndicators((prev) => {
      if (prev.left === canScrollLeft && prev.right === canScrollRight) {
        return prev;
      }
      return {
        left: canScrollLeft,
        right: canScrollRight
      };
    });
  };

  // requestAnimationFrame 기반의 스크롤 최적화(Throttling) 적용
  const handleViewportScroll = () => {
    if (!scrollTickingRef.current) {
      window.requestAnimationFrame(() => {
        checkScrollIndicators();
        scrollTickingRef.current = false;
      });
      scrollTickingRef.current = true;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkScrollIndicators();
    }, 400); // 렌더링 완료 타이밍 보장
    
    window.addEventListener('resize', checkScrollIndicators);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollIndicators);
    };
  }, [activeFloor, activeZone]);



  // 엔터 입력 시 정확히 일치하는 단일 셀만 강조하기 위한 상태 키 (r,c)
  const [exactMatchKey, setExactMatchKey] = useState(null);

  const showToast = (message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const colMap = useMemo(() => {
    if (activeFloor === '3F') {
      const map = {};
      for (let i = 0; i <= 11; i++) map[i] = i;
      for (let i = 12; i <= 14; i++) map[i] = 12;
      for (let i = 15; i <= 16; i++) map[i] = 13;
      return map;
    }
    if (activeZone === 'C5') {
      return {
        0: 0,
        1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1,
        12: 2, 13: 3, 14: 4,
        15: 5, 16: 6, 17: 7, 18: 8, 19: 9, 20: 10, 21: 11, 22: 12, 23: 13,
        24: 14
      };
    } else {
      return {
        0: 0, 1: 1,
        2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11,
        12: 12, 13: 13, 14: 14,
        15: 15, 16: 15, 17: 15, 18: 15, 19: 15, 20: 15, 21: 15, 22: 15, 23: 15,
        24: 16
      };
    }
  }, [activeFloor, activeZone]);

  // 1. 초기 층별 그리드 상태 맵 설정
  const [gridState] = useState(() => {
    const initialState = {};
    floors.forEach((floor) => {
      initialState[floor] = rawSeatingData[floor].grid.map((row) =>
        row.map((cell) => {
          if (cell.type === 'seat') {
            return {
              ...cell,
              occupied: false,
              user: null,
              assignedTime: null,
            };
          }
          return cell;
        })
      );
    });
    return initialState;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ESC 키 클릭 시 모달 닫기
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  // 2. 현재 선택된 층의 데이터셋 단축 바인딩
  const currentFloorConfig = rawSeatingData[activeFloor];
  const currentGrid = gridState[activeFloor] || [];

  // 3. 현재 층의 병합 셀 영역 캐싱 맵 (O(1) 조회를 위함)
  const mergeMap = useMemo(() => {
    const map = {};
    if (!currentFloorConfig) return map;

    currentFloorConfig.mergeCells.forEach((mc) => {
      let startCol = mc.startCol;
      let startRow = mc.startRow;
      let endCol = mc.endCol;
      let endRow = mc.endRow;
      let value = mc.value;

      // 5층 C5 구역 활성화 시 C6와 겹치는 가로 복도(col 5~13)의 시작점을 오아시스/화장실 영역의 12열로 당겨서 단축 렌더링되도록 함
      if (activeFloor === '5F' && activeZone === 'C5') {
        if (value.includes('복도') && startRow === 5 && endRow === 6 && startCol === 5 && endCol === 13) {
          startCol = 12;
        }
      }
      
      // 5층 C6 구역 활성화 시 가로 복도(col 5~13)의 시작점을 비상구 바로 옆인 2열까지 쭉 늘려 렌더링되도록 함
      if (activeFloor === '5F' && activeZone === 'C6') {
        if (value.includes('복도') && startRow === 5 && endRow === 6 && startCol === 5 && endCol === 13) {
          startCol = 2;
        }
      }

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          map[`${r},${c}`] = {
            isStart: r === startRow && c === startCol,
            startRow: startRow,
            startCol: startCol,
            endRow: endRow,
            endCol: endCol,
            value: value,
          };
        }
      }
    });
    return map;
  }, [activeFloor, activeZone, currentFloorConfig]);

  // 4. 검색어 매칭 셀 2차원 캐싱 (인접 셀 융합 처리를 위한 용도)
  const matchMap = useMemo(() => {
    const map = {};
    if (!searchQuery.trim() || !currentGrid) return map;
    const query = searchQuery.toLowerCase().trim();
    
    // 완전 일치 상태 키가 명시되어 있다면 해당 셀 하나만 강조 처리
    if (exactMatchKey) {
      map[exactMatchKey] = true;
      return map;
    }
    
    currentGrid.forEach((row, r) => {
      row.forEach((cell, c) => {
        const key = `${r},${c}`;
        const mergeInfo = mergeMap[key];
        if (cell.type === 'empty' && !mergeInfo) return;
        /* eslint-disable no-misleading-character-class */
        const displayVal = (mergeInfo ? mergeInfo.value : (cell.value || ''))
          .replace(/[🛗👥🪜🚻🏝️🚷]/gu, '')
          .trim()
          .toLowerCase();
        /* eslint-enable no-misleading-character-class */
        
        const matchesValue = displayVal.includes(query);
        const matchesUser = cell.user && cell.user.toLowerCase().includes(query);
        if (matchesValue || matchesUser) {
          map[key] = true;
        }
      });
    });
    return map;
  }, [searchQuery, currentGrid, mergeMap, exactMatchKey]);

  // 모바일: 검색 성공(toast) 시 하이라이트 셀로 자동 스크롤 (화면 중앙 정렬)
  useEffect(() => {
    if (!isMobile || !toast || !mapViewportRef.current) return;
    const timer = setTimeout(() => {
      const highlighted = mapViewportRef.current?.querySelector('.grid-cell.highlighted');
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      }
    }, 150); // 층/구역 전환 + React 리렌더링 완료 대기
    return () => clearTimeout(timer);
  }, [toast, isMobile]);

  // 타이핑 디바운스(300ms) — 현재 페이지에 결과가 없고 다른 페이지에만 있을 경우 해당 페이지로 자동 전환
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return; // 2글자 미만은 스킵

    const timer = setTimeout(() => {
      // 1. 현재 층/구역에 매칭 결과가 존재하는지 확인
      const curFloor = activeFloorRef.current;
      const curZone = activeZoneRef.current;
      const grid = gridState[curFloor];
      
      let hasMatchInCurrentPage = false;
      if (grid) {
        for (let r = 0; r < grid.length; r++) {
          for (let c = 0; c < grid[r].length; c++) {
            const cell = grid[r][c];
            if (cell.type !== 'seat') continue;
            
            // 5F인 경우 현재 구역 내 영역인지 체크
            if (curFloor === '5F') {
              const isC5 = (cell.value || '').toLowerCase().startsWith('c5') || (c >= 15 && c <= 23);
              const isC6 = (cell.value || '').toLowerCase().startsWith('c6') || (c >= 2 && c <= 11);
              if (curZone === 'C5' && !isC5) continue;
              if (curZone === 'C6' && !isC6) continue;
            }

            const seatValue = (cell.value || '').toLowerCase();
            const userName = (cell.user || '').toLowerCase();
            if (seatValue.includes(q) || userName.includes(q)) {
              hasMatchInCurrentPage = true;
              break;
            }
          }
          if (hasMatchInCurrentPage) break;
        }
      }

      // 편의시설 매치도 확인
      if (!hasMatchInCurrentPage) {
        const floorConfig = rawSeatingData[curFloor];
        if (floorConfig && floorConfig.mergeCells) {
          for (const mc of floorConfig.mergeCells) {
            if (curFloor === '5F') {
              const startCol = mc.startCol;
              const isC5 = startCol >= 15 && startCol <= 23;
              const isC6 = startCol >= 2 && startCol <= 11;
              if (curZone === 'C5' && !isC5) continue;
              if (curZone === 'C6' && !isC6) continue;
            }
            const cleanVal = mc.value.replace(/[🛗👥🪜🚻🏝️🚷]/gu, '').trim().toLowerCase();
            if (cleanVal.includes(q)) {
              hasMatchInCurrentPage = true;
              break;
            }
          }
        }
      }

      // 2. 현재 페이지에 결과가 없다면, 다른 층/구역 탐색하여 첫 매칭 구역으로 자동 전환
      if (!hasMatchInCurrentPage) {
        let targetFloor = '';
        let targetZone = '';
        
        // 3F 탐색
        const grid3 = gridState['3F'];
        let matched3 = false;
        if (grid3) {
          for (let r = 0; r < grid3.length; r++) {
            for (let c = 0; c < grid3[r].length; c++) {
              const cell = grid3[r][c];
              if (cell.type !== 'seat') continue;
              if ((cell.value || '').toLowerCase().includes(q) || (cell.user || '').toLowerCase().includes(q)) {
                matched3 = true;
                break;
              }
            }
            if (matched3) break;
          }
          if (!matched3) {
            const config3 = rawSeatingData['3F'];
            if (config3 && config3.mergeCells) {
              for (const mc of config3.mergeCells) {
                const cleanVal = mc.value.replace(/[🛗👥🪜🚻🏝️🚷]/gu, '').trim().toLowerCase();
                if (cleanVal.includes(q)) {
                  matched3 = true;
                  break;
                }
              }
            }
          }
        }

        if (matched3) {
          targetFloor = '3F';
        } else {
          // 5F 탐색
          const grid5 = gridState['5F'];
          let matched5C5 = false;
          let matched5C6 = false;
          if (grid5) {
            for (let r = 0; r < grid5.length; r++) {
              for (let c = 0; c < grid5[r].length; c++) {
                const cell = grid5[r][c];
                if (cell.type !== 'seat') continue;
                const seatValue = (cell.value || '').toLowerCase();
                const userName = (cell.user || '').toLowerCase();
                if (seatValue.includes(q) || userName.includes(q)) {
                  const isC5 = seatValue.startsWith('c5') || (c >= 15 && c <= 23);
                  const isC6 = seatValue.startsWith('c6') || (c >= 2 && c <= 11);
                  if (isC5) matched5C5 = true;
                  if (isC6) matched5C6 = true;
                }
              }
            }
            const config5 = rawSeatingData['5F'];
            if (config5 && config5.mergeCells) {
              for (const mc of config5.mergeCells) {
                const cleanVal = mc.value.replace(/[🛗👥🪜🚻🏝️🚷]/gu, '').trim().toLowerCase();
                if (cleanVal.includes(q)) {
                  const startCol = mc.startCol;
                  if (startCol >= 15 && startCol <= 23) matched5C5 = true;
                  if (startCol >= 2 && startCol <= 11) matched5C6 = true;
                }
              }
            }
          }

          if (matched5C5) {
            targetFloor = '5F';
            targetZone = 'C5';
          } else if (matched5C6) {
            targetFloor = '5F';
            targetZone = 'C6';
          }
        }

        // 일치하는 다른 페이지가 있다면 상태 업데이트
        if (targetFloor) {
          setActiveFloor(targetFloor);
          if (targetFloor === '5F') {
            setActiveZone(targetZone);
          }
        }
      }

      // 3. 모바일의 경우 전환 후 하이라이트된 첫 셀로 자동 스크롤 실행 (화면 중앙 정렬)
      if (isMobile && mapViewportRef.current) {
        setTimeout(() => {
          const highlighted = mapViewportRef.current?.querySelector('.grid-cell.highlighted');
          if (highlighted) {
            highlighted.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
          }
        }, 100);
      }
    }, 300); // 키 입력 멈춤 300ms 후 실행

    return () => clearTimeout(timer);
  }, [searchQuery, isMobile]);

  // 5. 셀 클릭 핸들러
  const handleCellClick = (cell) => {
    if (cell.type === 'seat') {
      setSelectedCell(cell);
      setIsModalOpen(true);
    }
  };

  // 5.5. 실시간 검색 시 해당 층/구역 자동 포커스 및 화면 전환 핸들러
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setExactMatchKey(null); // 검색창 타이핑 시작 시 완전 일치 모드 초기화
  };

  // 엔터 입력 시 실행되는 정밀 검색 (1단계 완전 일치 우선 -> 2단계 부분 일치 백업)
  const handleSearchSubmit = () => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) return; // 2글자 미만은 검색 무시

    // 현재 보고 있는 층을 1순위로 탐색하도록 정렬된 리스트 생성
    const sortedFloors = [activeFloor, ...floors.filter(f => f !== activeFloor)];

    // [1단계] 100% 완전 일치 (Exact Match) 우선 검사
    // 1-1. 좌석 번호 또는 사용자 이름 완전 일치 검사
    for (const floor of sortedFloors) {
      const grid = gridState[floor];
      if (!grid) continue;

      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          const cell = grid[r][c];
          if (cell.type !== 'seat') continue;

          const seatValue = (cell.value || '').toLowerCase();
          const userName = (cell.user || '').toLowerCase();

          if (seatValue === query || userName === query) {
            setActiveFloor(floor);
            setExactMatchKey(`${r},${c}`); // 완전 일치하는 정확한 1개 좌석 키 등록
            let targetZone = '';
            if (floor === '5F') {
              if (seatValue.startsWith('c5') || (c >= 15 && c <= 23)) {
                setActiveZone('C5');
                targetZone = 'C5 구역';
              } else if (seatValue.startsWith('c6') || (c >= 2 && c <= 11)) {
                setActiveZone('C6');
                targetZone = 'C6 구역';
              }
            }

            const elevatorCol = floor === '3F' ? 11 : 14;
            const direction = c === elevatorCol ? '중앙' : c < elevatorCol ? '좌측' : '우측';
            const statusText = cell.occupied ? `${cell.user}님 사용 중` : '공석';
            const floorDesc = floor === '3F' ? '3층' : '5층';
            const zoneDesc = targetZone ? ` (${targetZone})` : '';

            showToast({
              seatName: cell.value.toUpperCase(),
              statusText,
              floorDesc,
              zoneDesc,
              direction
            });
            return; // 1단계 완전 매칭 성공 시 즉시 종료
          }
        }
      }
    }

    // 1-2. 편의시설 명칭 완전 일치 검사
    for (const floor of sortedFloors) {
      const floorConfig = rawSeatingData[floor];
      if (!floorConfig || !floorConfig.mergeCells) continue;

      for (const mc of floorConfig.mergeCells) {
        const cleanVal = mc.value.replace(/[🛗👥🪜🚻🏝️🚷]/gu, '').trim().toLowerCase();
        if (cleanVal === query) {
          setActiveFloor(floor);
          setExactMatchKey(`${mc.startRow},${mc.startCol}`); // 완전 일치하는 편의시설 키 등록
          let targetZone = '';
          if (floor === '5F') {
            const startCol = mc.startCol;
            if (startCol >= 15 && startCol <= 23) {
              setActiveZone('C5');
              targetZone = 'C5 구역';
            } else if (startCol >= 2 && startCol <= 11) {
              setActiveZone('C6');
              targetZone = 'C6 구역';
            }
          }

          const elevatorCol = floor === '3F' ? 11 : 14;
          const direction = (mc.startCol <= elevatorCol && mc.endCol >= elevatorCol)
            ? '중앙'
            : mc.startCol < elevatorCol
            ? '좌측'
            : '우측';
          const floorDesc = floor === '3F' ? '3층' : '5층';
          const zoneDesc = targetZone ? ` (${targetZone})` : '';

          showToast({
            seatName: cleanVal,
            statusText: '공용시설',
            floorDesc,
            zoneDesc,
            direction
          });
          return; // 1단계 편의시설 완전 매칭 성공 시 즉시 종료
        }
      }
    }

    // [2단계] 부분 일치 (Partial Match, includes) 백업 검사
    // 2-1. 좌석 번호 또는 사용자 이름 부분 일치 검사
    for (const floor of sortedFloors) {
      const grid = gridState[floor];
      if (!grid) continue;

      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          const cell = grid[r][c];
          if (cell.type !== 'seat') continue;

          const seatValue = (cell.value || '').toLowerCase();
          const userName = (cell.user || '').toLowerCase();

          if (seatValue.includes(query) || userName.includes(query)) {
            setActiveFloor(floor);
            let targetZone = '';
            if (floor === '5F') {
              if (seatValue.startsWith('c5') || (c >= 15 && c <= 23)) {
                setActiveZone('C5');
                targetZone = 'C5 구역';
              } else if (seatValue.startsWith('c6') || (c >= 2 && c <= 11)) {
                setActiveZone('C6');
                targetZone = 'C6 구역';
              }
            }

            const elevatorCol = floor === '3F' ? 11 : 14;
            const direction = c === elevatorCol ? '중앙' : c < elevatorCol ? '좌측' : '우측';
            const statusText = cell.occupied ? `${cell.user}님 사용 중` : '공석';
            const floorDesc = floor === '3F' ? '3층' : '5층';
            const zoneDesc = targetZone ? ` (${targetZone})` : '';

            showToast({
              seatName: cell.value.toUpperCase(),
              statusText,
              floorDesc,
              zoneDesc,
              direction
            });
            return; // 부분 매칭 성공 시 즉시 종료
          }
        }
      }
    }

    // 2-2. 편의시설 명칭 부분 일치 검사
    for (const floor of sortedFloors) {
      const floorConfig = rawSeatingData[floor];
      if (!floorConfig || !floorConfig.mergeCells) continue;

      for (const mc of floorConfig.mergeCells) {
        const cleanVal = mc.value.replace(/[🛗👥🪜🚻🏝️🚷]/gu, '').trim().toLowerCase();
        if (cleanVal.includes(query)) {
          setActiveFloor(floor);
          let targetZone = '';
          if (floor === '5F') {
            const startCol = mc.startCol;
            if (startCol >= 15 && startCol <= 23) {
              setActiveZone('C5');
              targetZone = 'C5 구역';
            } else if (startCol >= 2 && startCol <= 11) {
              setActiveZone('C6');
              targetZone = 'C6 구역';
            }
          }

          const elevatorCol = floor === '3F' ? 11 : 14;
          const direction = (mc.startCol <= elevatorCol && mc.endCol >= elevatorCol)
            ? '중앙'
            : mc.startCol < elevatorCol
            ? '좌측'
            : '우측';
          const floorDesc = floor === '3F' ? '3층' : '5층';
          const zoneDesc = targetZone ? ` (${targetZone})` : '';

          showToast({
            seatName: cleanVal,
            statusText: '공용시설',
            floorDesc,
            zoneDesc,
            direction
          });
          return; // 부분 매칭 성공 시 즉시 종료
        }
      }
    }
  };

  // 6. 현재 층의 통계 계산
  const stats = useMemo(() => {
    let total = 0;
    let occupied = 0;
    currentGrid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type === 'seat') {
          total++;
          if (cell.occupied) occupied++;
        }
      });
    });
    return { total, occupied, available: total - occupied };
  }, [currentGrid]);

  return (
    <div className="app-container">
      {/* 대시보드 헤더 */}
      <header className="app-header">
        {/* 층 전환 및 구역 선택 탭 컨트롤러 컨테이너 (제목 위치 대체) */}
        <div className="floor-selector-container">
          <div className="floor-selector">
            {floors.map((floor) => {
              const isActive = activeFloor === floor;
              if (floor === '5F' && isActive) {
                return (
                  <div key={floor} className="floor-tab-group active">
                    <span className="floor-tab-label">5F</span>
                    <div className="zone-selector-inline">
                      <button
                        className={`zone-tab ${activeZone === 'C5' ? 'active' : ''}`}
                        onClick={() => {
                          setActiveZone('C5');
                          setSelectedCell(null);
                        }}
                      >
                        C5
                      </button>
                      <button
                        className={`zone-tab ${activeZone === 'C6' ? 'active' : ''}`}
                        onClick={() => {
                          setActiveZone('C6');
                          setSelectedCell(null);
                        }}
                      >
                        C6
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={floor}
                  className={`floor-tab ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveFloor(floor);
                    setSelectedCell(null);
                    if (floor === '5F') {
                      setActiveZone('C5');
                    }
                  }}
                >
                  {floor}
                </button>
              );
            })}
          </div>
        </div>

        {/* 모바일 전용 우측 액션 버튼 */}
        <div className="header-mobile-actions">
          <button
            className="theme-toggle-btn"
            onClick={() => setIsLightTheme(!isLightTheme)}
            title={isLightTheme ? "다크모드로 전환" : "라이트모드로 전환"}
          >
            {isLightTheme ? '🌙' : '☀️'}
          </button>
        </div>
        
        {/* 실시간 통합 검색 & 테마 토글 (항상 노출) */}
        <div className="search-area">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="좌석 번호, 구역 또는 퍼실리테이터 검색..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit();
                  e.target.blur(); // 모바일 가상 키보드 닫기
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCell(null);
                  setToast(null);
                  setExactMatchKey(null);
                }}
                title="검색어 지우기"
              >
                ×
              </button>
            )}
          </div>
          <button
            className="theme-toggle-btn pc-only"
            onClick={() => setIsLightTheme(!isLightTheme)}
            title={isLightTheme ? "다크모드로 전환" : "라이트모드로 전환"}
          >
            {isLightTheme ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* 범례 */}
      <div className="legend-panel" style={{ justifyContent: 'flex-start', flexWrap: 'nowrap', flexShrink: 0 }}>
        <div className="legend-item">
          <span className="legend-color facilitator"></span>
          <span>퍼실리테이터</span>
        </div>
        <div className="legend-item">
          <span className="legend-color facility"></span>
          <span>편의/공용 공간</span>
        </div>
        <div className="legend-item">
          <span className="legend-color restricted"></span>
          <span>사용 제한</span>
        </div>
        <div className="legend-item">
          <span className="legend-color corridor"></span>
          <span>기타</span>
        </div>
      </div>



      {/* 좌석 배치도 본문 래퍼 */}
      <main className="map-viewport-wrapper">
        <div
          className="map-viewport"
          ref={mapViewportRef}
          onScroll={handleViewportScroll}
        >
          <div
            className="seating-grid-zoom-container"
            style={{
              width: isMobile ? `calc(100% * ${zoom})` : '100%',
              height: isMobile ? `calc(100% * ${zoom})` : '100%',
            }}
          >
            <div
              className="seating-grid"
              style={{
                transform: isMobile ? `scale(${zoom})` : 'none',
                transformOrigin: 'top left',
                width: isMobile ? `calc(100% / ${zoom})` : '100%',
                height: isMobile ? `calc(100% / ${zoom})` : '100%',
                gridTemplateRows: isMobile
                  ? `repeat(${currentFloorConfig?.dimensions?.rows || 1}, auto)`
                  : `repeat(${currentFloorConfig?.dimensions?.rows || 1}, 1fr)`,
                gridTemplateColumns: currentFloorConfig?.dimensions?.cols === 17
                  ? 'repeat(10, minmax(50px, 1fr)) minmax(75px, 1.5fr) minmax(68px, 0.6fr) minmax(68px, 0.6fr)'
                  : currentFloorConfig?.dimensions?.cols === 25
                  ? (activeZone === 'C5'
                    ? 'minmax(90px, 1.2fr) repeat(2, minmax(50px, 1fr)) minmax(75px, 1.5fr) repeat(10, minmax(50px, 1fr))'
                    : 'minmax(50px, 1fr) repeat(10, minmax(50px, 1fr)) repeat(2, minmax(50px, 1fr)) minmax(75px, 1.5fr) minmax(90px, 1.2fr) minmax(50px, 1fr)')
                  : `repeat(${currentFloorConfig?.dimensions?.cols || 1}, minmax(50px, 1fr))`
              }}
            >
          {/* CLUSTER 컴퓨터 좌석 및 회의 공간 통합 구역 패널 배경 */}
          {activeFloor === '3F' && (
            <div
              className="zone-panel-bg"
              style={{
                gridRow: '4 / 19',
                gridColumn: '2 / 11'
              }}
            />
          )}
          {activeFloor === '5F' && (
            <>
              {/* C6 구역 (좌측) */}
              {activeZone === 'C6' && (
                <div
                  className="zone-panel-bg"
                  style={{
                    gridRow: '8 / 16',
                    gridColumn: `${colMap[2]} / ${colMap[11] + 1}`
                  }}
                />
              )}
              {/* C5 구역 (우측) */}
              {activeZone === 'C5' && (
                <div
                  className="zone-panel-bg"
                  style={{
                    gridRow: '8 / 16',
                    gridColumn: `${colMap[15]} / ${colMap[23] + 1}`
                  }}
                />
              )}
            </>
          )}

          {/* ㄱ자 회전형 (L자형) 통합 사용불가 영역 (물리적으로 단 하나의 SVG 컴포넌트로 병합) */}
          {activeFloor === '3F' && (
            <div
              className="restricted-l-zone"
              style={{
                gridRow: '6 / 19',
                gridColumn: `${colMap[11] + 1} / ${colMap[16] + 2}`,
                position: 'relative',
                zIndex: 2
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 50 130" preserveAspectRatio="none" style={{ display: 'block' }}>
                <defs>
                  <pattern id="restricted-stripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="hsla(350, 80%, 55%, 0.15)" strokeWidth="2" />
                  </pattern>
                </defs>
                <path
                  d="M 0.5,0.5 L 49.5,0.5 L 49.5,69.5 L 23.5,69.5 L 23.5,129.5 L 0.5,129.5 Z"
                  fill="url(#restricted-stripe)"
                  stroke="hsla(350, 80%, 55%, 0.3)"
                  strokeWidth="1.5"
                  style={{ vectorEffect: 'non-scaling-stroke' }}
                />
              </svg>
              <div className="restricted-l-content" style={{ top: '30%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                  <AreaIcon name="사용불가" size={12} />
                  <span style={{ fontWeight: '700', fontSize: '10px', marginTop: '2px' }}>사용불가</span>
                  <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-secondary)', marginTop: '1px' }}>LUNA</span>
                </div>
              </div>
            </div>
          )}

          {currentGrid.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              // A열(첫 번째 열)은 빈 영역이므로 렌더링에서 스킵하여 여백을 제거하고 정렬을 맞춤
              if (cIdx === 0) {
                return null;
              }

              // 3층 회의 공간 위아래 8개 자리 가로 배치 보정
              if (activeFloor === '3F' && (cIdx === 2 || cIdx === 10)) {
                if (rIdx === 7 || rIdx === 16) {
                  const sIdxStart = rIdx;
                  const seat1 = currentGrid[sIdxStart][cIdx];
                  const seat2 = currentGrid[sIdxStart + 1][cIdx];
                  const seats = [seat1, seat2];

                  return (
                    <div
                      key={`meeting-col-horizontal-${rIdx}-${cIdx}`}
                      style={{
                        gridRow: `${sIdxStart + 1} / span 2`,
                        gridColumn: `${colMap[cIdx]}`,
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '3px',
                        height: '100%',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      {seats.map((sCell) => {
                        const cellKey = `${sCell.r},${sCell.c}`;
                        const isMatch = !!matchMap[cellKey];
                        // 구역명과 행열 좌표 사이 개행(\n)을 명시적으로 넣어 좁은 폭에서 2줄로 표시되도록 보정
                        const displayValue = sCell.value
                          .replace(/[🛗👥🪜🚻🏝️🚷]/gu, '')
                          .trim()
                          .replace(/([a-zA-Z0-9]+)(r[0-9]+s[0-9]+)/i, '$1\n$2');
                        const isFacilitator = sCell.value.includes('r7') || sCell.value.includes('r6');

                        const cellClasses = [
                          'grid-cell',
                          'seat',
                          'narrow-seat',
                          sCell.occupied ? 'occupied' : '',
                          isFacilitator ? 'facilitator' : '',
                          isMatch ? 'highlighted' : '',
                        ].filter(Boolean).join(' ');

                        return (
                          <div
                            key={cellKey}
                            className={cellClasses}
                            style={{
                              flex: 1,
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              zIndex: isMatch ? 15 : 2
                            }}
                            onClick={() => handleCellClick(sCell)}
                            title={`${displayValue} ${isFacilitator ? '(퍼실리테이터)' : ''} ${sCell.occupied ? `(${sCell.user})` : ''}`.trim()}
                          >
                            <span className="cell-text">
                              {displayValue}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                if (rIdx === 8 || rIdx === 17) {
                  return null; // 개별 렌더링 스킵
                }
              }

              // activeZone이 C5일 때 비상구 및 C6 구역(1~11열)을 뭉침 블록 1개로 대체 (비상구 높이인 6행부터 15행까지 확장)
              if (activeFloor === '5F' && activeZone === 'C5' && cIdx >= 1 && cIdx <= 11) {
                if (cIdx === 2 && rIdx === 5) {
                  return (
                    <div
                      key="collapsed-c6-zone"
                      className="grid-cell facility collapsed-zone-block c6-theme"
                      style={{
                        gridRow: '6 / 16',
                        gridColumn: `${colMap[2]}`
                      }}
                      onClick={() => setActiveZone('C6')}
                      title="클릭하여 C6 구역 펼치기"
                    >
                      <div className="collapsed-title">C6</div>
                      <div className="collapsed-subtitle">구역</div>
                      <div className="collapsed-hint">◀ 펼치기</div>
                    </div>
                  );
                }
                return null; // 나머지 C6 셀들은 렌더링 스킵
              }

              // activeZone이 C5일 때 C5 구역(15~23열)의 7개 좌석들을 8행~15행 영역에 세로로 가득 차게 flexbox로 렌더링
              if (activeFloor === '5F' && activeZone === 'C5' && cIdx >= 15 && cIdx <= 23) {
                if (rIdx === 7) {
                  const seatsInCol = [];
                  for (let r = 7; r <= 13; r++) {
                    seatsInCol.push(currentGrid[r][cIdx]);
                  }
                  return (
                    <div
                      key={`c5-col-container-${cIdx}`}
                      className="c5-col-container"
                      style={{
                        gridRow: '8 / 16',
                        gridColumn: `${colMap[cIdx]}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        height: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      {seatsInCol.map((cCell, sIdx) => {
                        const cellKey = `${7 + sIdx},${cIdx}`;
                        let rawDisplayValue = cCell.value;
                        let cellType = cCell.type;
                        
                        // 하이라이트 매칭 정보
                        const isMatch = !!matchMap[cellKey];
                        const customStyle = {
                          flex: 1,
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          zIndex: isMatch ? 15 : 2
                        };

                        const displayValue = rawDisplayValue
                          .replace(/[🛗👥🪜🚻🏝️🚷]/gu, '')
                          .trim();
                        
                        const cellClasses = [
                          'grid-cell',
                          cellType,
                          cCell.occupied ? 'occupied' : '',
                          isMatch ? 'highlighted' : '',
                        ].filter(Boolean).join(' ');

                        return (
                          <div
                            key={cellKey}
                            className={cellClasses}
                            style={customStyle}
                            onClick={() => handleCellClick(cCell)}
                            title={`${displayValue} ${cCell.occupied ? `(${cCell.user})` : ''}`.trim()}
                          >
                            <span className="cell-text">
                              {displayValue}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                if (rIdx >= 8 && rIdx <= 14) {
                  return null; // rIdx 8~14만 렌더링 스킵 (기존 좌석 영역)
                }
              }

              // activeZone이 C6일 때 C5 구역(15~23열)을 뭉침 블록 1개로 대체 (비상구 높이인 6행부터 15행까지 확장)
              if (activeFloor === '5F' && activeZone === 'C6' && cIdx >= 15 && cIdx <= 23) {
                if (cIdx === 15 && rIdx === 5) {
                  return (
                    <div
                      key="collapsed-c5-zone"
                      className="grid-cell facility collapsed-zone-block c5-theme"
                      style={{
                        gridRow: '6 / 16',
                        gridColumn: `${colMap[15]}`
                      }}
                      onClick={() => setActiveZone('C5')}
                      title="클릭하여 C5 구역 펼치기"
                    >
                      <div className="collapsed-title">C5</div>
                      <div className="collapsed-subtitle">구역</div>
                      <div className="collapsed-hint">펼치기 ▶</div>
                    </div>
                  );
                }
                return null; // 나머지 C5 셀들은 렌더링 스킵
              }

              const key = `${rIdx},${cIdx}`;
              const mergeInfo = mergeMap[key];

              if (mergeInfo && !mergeInfo.isStart) {
                return null;
              }

              let rawDisplayValue = cell.value;
              let cellType = cell.type;
              let customStyle;
              let corridorDir = '';

              if (mergeInfo && mergeInfo.isStart) {
                const rowSpan = mergeInfo.endRow - mergeInfo.startRow + 1;
                const colSpan = mergeInfo.endCol - mergeInfo.startCol + 1;
                const startColMapped = colMap[mergeInfo.startCol];
                const endColMapped = colMap[mergeInfo.endCol];
                const colSpanMapped = endColMapped - startColMapped + 1;
                customStyle = {
                  gridRow: `${mergeInfo.startRow + 1} / span ${rowSpan}`,
                  gridColumn: `${startColMapped} / span ${colSpanMapped}`,
                };
                rawDisplayValue = mergeInfo.value || cell.value;
                
                if (rawDisplayValue.includes('사용불가') || rawDisplayValue.includes('LUNA') || rawDisplayValue.includes('비상구')) {
                  cellType = 'restricted';
                } else if (rawDisplayValue.includes('복도') || rawDisplayValue.includes('세미나실') || rawDisplayValue.includes('테이블')) {
                  cellType = 'corridor';
                  if (rawDisplayValue.includes('복도')) {
                    // 5층의 가로 복도(5행~6행)는 단축되었을 때도 가로 복도(horizontal)로 판정되도록 예외 처리
                    const is5FHorizontalCorridor = activeFloor === '5F' && mergeInfo.startRow === 5 && mergeInfo.endRow === 6;
                    const isHorizontal = is5FHorizontalCorridor || (colSpan > rowSpan);
                    
                    if (isHorizontal) {
                      // 중앙 세로 복도의 우측에 배치된 가로 복도는 왼쪽으로 자연스럽게 결합되도록 horizontal-left 클래스 부여
                      const centerCol = activeFloor === '3F' ? 11 : 14;
                      corridorDir = mergeInfo.startCol >= centerCol ? 'horizontal-left' : 'horizontal';
                    } else {
                      corridorDir = 'vertical';
                    }
                  }
                } else {
                  cellType = 'facility';
                }
              } else {
                // 일반 셀의 절대 좌표 명시 (배경 판넬로 인해 좌석 셀들이 그리드 밖으로 밀려나는 현상 방지)
                customStyle = {
                  gridRow: `${rIdx + 1}`,
                  gridColumn: `${colMap[cIdx]}`
                };
              }

              // 유니코드 텍스트 이모지 제거하여 깨끗한 텍스트 추출
              /* eslint-disable no-misleading-character-class */
              const displayValue = rawDisplayValue.replace(/[🛗👥🪜🚻🏝️🚷]/gu, '').trim();
              /* eslint-enable no-misleading-character-class */

              const isMatch = !!matchMap[key];

              if (isMatch) {
                customStyle.zIndex = 15;
              }

              const isFacilitator = activeFloor === '3F' && cell.type === 'seat' && (cell.value.includes('r7') || cell.value.includes('r6'));
              const isDimmed = activeFloor === '5F' && cell.type === 'seat' && (
                (activeZone === 'C5' && cell.value.startsWith('c6')) ||
                (activeZone === 'C6' && cell.value.startsWith('c5'))
              );
              const isExit = rawDisplayValue.includes('비상구');
              const cellClasses = [
                'grid-cell',
                cellType,
                corridorDir,
                cell.occupied ? 'occupied' : '',
                isFacilitator ? 'facilitator' : '',
                isMatch ? 'highlighted' : '',
                isDimmed ? 'dimmed' : '',
                isExit ? 'exit-cell' : '',
              ].filter(Boolean).join(' ');

              if (activeFloor === '3F' && cIdx >= 12) {
                const isSeminar = rIdx >= 12 && rIdx <= 17 && cIdx >= 15 && cIdx <= 16;
                if (!isSeminar) {
                  return null;
                }
              }

              return (
                <div
                  key={key}
                  className={cellClasses}
                  style={customStyle}
                  onClick={() => !isDimmed && handleCellClick(cell)}
                  title={cell.type === 'seat' ? `${displayValue} ${isFacilitator ? '(퍼실리테이터)' : ''} ${cell.occupied ? `(${cell.user})` : ''}`.trim() : displayValue}
                >
                  {/* 편의시설/제한시설인 경우 세련된 플랫 벡터 아이콘 주입 */}
                  {cellType !== 'seat' && cellType !== 'corridor' && cellType !== 'empty' && (
                    <div className="cell-icon-wrapper">
                      <AreaIcon name={rawDisplayValue} size={14} />
                    </div>
                  )}
                  <span className="cell-text">
                    {displayValue}
                  </span>
                </div>
              );
            })
          )}
          </div>
        </div>
      </div>


      {/* 모바일 좌우 스크롤 가능 여부 가이드 화살표 */}
      {isMobile && (
        <>
          {scrollIndicators.left && (
            <div className="scroll-indicator indicator-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </div>
          )}
          {scrollIndicators.right && (
            <div className="scroll-indicator indicator-right">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          )}
        </>
      )}
    </main>

      {/* 토스트 안내 메시지 */}
      {toast && (
        <div className="toast-message">
          <span className="toast-icon">📍</span>
          <span className="toast-text">
            <span className="toast-seat">{toast.seatName}</span>
            {toast.statusText !== '공석' && (
              <span className="toast-status"> ({toast.statusText})</span>
            )}
            <strong className="toast-floor">{toast.floorDesc}</strong>
            {toast.zoneDesc && <span className="toast-zone">{toast.zoneDesc}</span>}
            {' '}엘리베이터 기준{' '}
            <strong className="toast-dir">{toast.direction}</strong>에 위치해 있습니다.
          </span>
        </div>
      )}

      {/* 좌석 상세 정보 모달 */}
      {isModalOpen && selectedCell && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            
            <div className="modal-header">
              {activeFloor === '3F' && (selectedCell.value.includes('r7') || selectedCell.value.includes('r6')) && (
                <span className="modal-tag" style={{ background: 'rgba(251, 146, 60, 0.15)', color: '#fb923c', border: '1px solid rgba(251, 146, 60, 0.3)' }}>
                  퍼실리테이터 지정석
                </span>
              )}
              <h2 className="modal-title">{selectedCell.value.toUpperCase()} 좌석 정보</h2>
            </div>

            <div className="modal-body">
              <div className="info-row">
                <span className="info-label">구역 분류</span>
                <span className="info-value">
                  {activeFloor} CLUSTER{activeFloor === '5F' ? ` (${activeZone} 구역)` : ''}
                </span>
              </div>
              
              {selectedCell.occupied && selectedCell.user && (
                <div className="info-row">
                  <span className="info-label">현재 입실자</span>
                  <span className="info-value">{selectedCell.user}</span>
                </div>
              )}

              {selectedCell.occupied && selectedCell.assignedTime && (
                <div className="info-row">
                  <span className="info-label">입실 등록 시각</span>
                  <span className="info-value">{selectedCell.assignedTime}</span>
                </div>
              )}

              <div className="modal-footer" style={{ marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setIsModalOpen(false)}>
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
