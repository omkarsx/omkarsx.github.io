(() => {
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const themeToggle = document.getElementById("themeToggle");
  const scrollProgress = document.getElementById("scrollProgress");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");
  const circuitCanvas = document.getElementById("circuitCanvas");
  const copyEmailBtn = document.getElementById("copyEmailBtn");
  const copyStatus = document.getElementById("copyStatus");
  const emailLink = document.getElementById("emailLink");
  const localClock = document.getElementById("localClock");
  const orbitPanel = document.querySelector(".orbit-panel");
  const orbitSystem = document.querySelector(".orbit-system");
  const skillTreeStage = document.getElementById("skillTreeStage");
  const skillTreeLines = document.getElementById("skillTreeLines");
  const skillTreeNodes = Array.from(document.querySelectorAll(".tree-node"));
  const treeFocusPanel = document.getElementById("treeFocusPanel");
  const treeFocusTitle = document.getElementById("treeFocusTitle");
  const treeFocusDescription = document.getElementById("treeFocusDescription");
  const treeFocusBranch = document.getElementById("treeFocusBranch");
  const treeFocusType = document.getElementById("treeFocusType");
  const treeFocusStatus = document.getElementById("treeFocusStatus");
  const photoFlipCard = document.getElementById("photoFlipCard");
  const profilePhotoTrigger = document.getElementById("profilePhotoTrigger");
  const chessCloseBtn = document.getElementById("chessCloseBtn");
  const chessModeOverlay = document.getElementById("chessModeOverlay");
  const playVsComputerBtn = document.getElementById("playVsComputerBtn");
  const playVsHumanBtn = document.getElementById("playVsHumanBtn");
  const chessModeTitle = document.getElementById("chessModeTitle");
  const heroChessUi = document.getElementById("heroChessUi");
  const heroChessBoard = document.getElementById("heroChessBoard");
  const chessStatus = document.getElementById("chessStatus");
  const chessModeBadge = document.getElementById("chessModeBadge");
  const chessResetBtn = document.getElementById("chessResetBtn");
  const journeyTimeline = document.getElementById("journeyTimeline");
  const timelineRailFill = document.getElementById("timelineRailFill");
  const timelineItems = Array.from(document.querySelectorAll(".timeline-item"));

  const contactForm = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");
  const yearEl = document.getElementById("currentYear");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const messageInput = document.getElementById("message");

  const EMAILJS_CONFIG = {
    publicKey: "lMTFAcuD2JlvF_3AQ",
    serviceID: "service_v4u9b0q",
    templateID: "template_pn9akwp"
  };

  const THEME_KEY = "omkarx-theme";
  let refreshCircuitTheme = null;

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const updateThemeButton = (theme) => {
    if (!themeToggle) {
      return;
    }

    const icon = themeToggle.querySelector("i");
    const text = themeToggle.querySelector("span");

    if (theme === "light") {
      themeToggle.setAttribute("aria-pressed", "true");
      if (icon) {
        icon.className = "fa-solid fa-sun";
      }
      if (text) {
        text.textContent = "Light";
      }
    } else {
      themeToggle.setAttribute("aria-pressed", "false");
      if (icon) {
        icon.className = "fa-solid fa-moon";
      }
      if (text) {
        text.textContent = "Dark";
      }
    }
  };

  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    updateThemeButton(theme);
    if (typeof refreshCircuitTheme === "function") {
      refreshCircuitTheme();
    }
  };

  const getInitialTheme = () => {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }

    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    return prefersLight ? "light" : "dark";
  };

  applyTheme(getInitialTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
      const nextTheme = current === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      window.localStorage.setItem(THEME_KEY, nextTheme);
    });
  }

  const updateHeaderAndProgress = () => {
    if (header) {
      if (window.scrollY > 12) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }

    if (scrollProgress) {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
      scrollProgress.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
    }
  };

  updateHeaderAndProgress();
  window.addEventListener("scroll", updateHeaderAndProgress, { passive: true });

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("open", !expanded);
      navToggle.innerHTML = !expanded
        ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    });
  }

  const closeNav = () => {
    if (!nav || !navToggle) {
      return;
    }

    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
  };

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") {
        return;
      }

      const target = document.querySelector(href);
      if (!target) {
        return;
      }

      event.preventDefault();
      const offset = header ? header.offsetHeight : 0;
      const targetTop = href === "#top"
        ? 0
        : Math.max(target.getBoundingClientRect().top + window.scrollY - offset + 2, 0);
      window.scrollTo({ top: targetTop, behavior: "smooth" });
      closeNav();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) {
      closeNav();
    }
  });

  if (circuitCanvas instanceof HTMLCanvasElement) {
    const circuitContext = circuitCanvas.getContext("2d");
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (circuitContext) {
      const pointerState = {
        x: -1000,
        y: -1000,
        active: false,
        movedAt: 0
      };
      const circuitState = {
        width: 0,
        height: 0,
        dpr: 1,
        nodes: [],
        connections: [],
        pulses: [],
        palette: null,
        frameId: 0,
        lastTime: 0
      };

      const readCircuitPalette = () => {
        const styles = window.getComputedStyle(root);
        return {
          line: styles.getPropertyValue("--circuit-line").trim(),
          lineStrong: styles.getPropertyValue("--circuit-line-strong").trim(),
          node: styles.getPropertyValue("--circuit-node").trim(),
          nodeSoft: styles.getPropertyValue("--circuit-node-soft").trim(),
          pulse: styles.getPropertyValue("--circuit-pulse").trim(),
          grid: styles.getPropertyValue("--circuit-grid").trim()
        };
      };

      const randomBetween = (min, max) => min + Math.random() * (max - min);

      const getPointOnSegments = (segments, distance) => {
        if (!segments.length) {
          return { x: 0, y: 0 };
        }

        let remaining = Math.max(distance, 0);
        for (const segment of segments) {
          if (remaining <= segment.length || segment === segments[segments.length - 1]) {
            const progress = segment.length > 0 ? Math.min(Math.max(remaining / segment.length, 0), 1) : 0;
            return {
              x: segment.start.x + (segment.end.x - segment.start.x) * progress,
              y: segment.start.y + (segment.end.y - segment.start.y) * progress
            };
          }

          remaining -= segment.length;
        }

        const lastSegment = segments[segments.length - 1];
        return { x: lastSegment.end.x, y: lastSegment.end.y };
      };

      const buildConnectionGeometry = (points) => {
        const segments = [];
        let totalLength = 0;

        for (let index = 0; index < points.length - 1; index += 1) {
          const start = points[index];
          const end = points[index + 1];
          const length = Math.hypot(end.x - start.x, end.y - start.y);
          totalLength += length;
          segments.push({ start, end, length });
        }

        return {
          points,
          segments,
          totalLength,
          midpoint: getPointOnSegments(segments, totalLength / 2)
        };
      };

      const createTracePoints = (from, to) => {
        const points = [{ x: from.x, y: from.y }];
        const deltaX = to.x - from.x;
        const deltaY = to.y - from.y;

        if (Math.abs(deltaX) < 20 || Math.abs(deltaY) < 20) {
          points.push({ x: to.x, y: to.y });
          return points;
        }

        if (Math.random() > 0.5) {
          const midX = from.x + deltaX * randomBetween(0.34, 0.66);
          points.push({ x: midX, y: from.y });
          points.push({ x: midX, y: to.y });
        } else {
          const midY = from.y + deltaY * randomBetween(0.34, 0.66);
          points.push({ x: from.x, y: midY });
          points.push({ x: to.x, y: midY });
        }

        points.push({ x: to.x, y: to.y });
        return points;
      };

      const traceConnectionPath = (connection) => {
        circuitContext.beginPath();
        circuitContext.moveTo(connection.points[0].x, connection.points[0].y);
        for (let index = 1; index < connection.points.length; index += 1) {
          const point = connection.points[index];
          circuitContext.lineTo(point.x, point.y);
        }
      };

      const createPulse = () => {
        if (!circuitState.connections.length) {
          return null;
        }

        const connection = circuitState.connections[Math.floor(Math.random() * circuitState.connections.length)];
        return {
          connection,
          distance: randomBetween(0, Math.max(connection.totalLength, 1)),
          speed: randomBetween(34, 68),
          radius: randomBetween(1.6, 3.2),
          alpha: randomBetween(0.56, 0.96)
        };
      };

      const resetPulse = (pulse) => {
        const nextPulse = createPulse();
        if (!nextPulse) {
          return;
        }

        pulse.connection = nextPulse.connection;
        pulse.distance = 0;
        pulse.speed = nextPulse.speed;
        pulse.radius = nextPulse.radius;
        pulse.alpha = nextPulse.alpha;
      };

      const regenerateCircuit = () => {
        circuitState.width = window.innerWidth;
        circuitState.height = window.innerHeight;
        circuitState.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        circuitCanvas.width = Math.max(Math.round(circuitState.width * circuitState.dpr), 1);
        circuitCanvas.height = Math.max(Math.round(circuitState.height * circuitState.dpr), 1);
        circuitCanvas.style.width = `${circuitState.width}px`;
        circuitCanvas.style.height = `${circuitState.height}px`;
        circuitContext.setTransform(circuitState.dpr, 0, 0, circuitState.dpr, 0, 0);
        circuitState.palette = readCircuitPalette();

        const padding = circuitState.width < 640 ? 34 : 56;
        const spacing = circuitState.width < 640 ? 92 : circuitState.width < 1024 ? 108 : 124;
        const columns = Math.max(Math.floor((circuitState.width - padding * 2) / spacing), 4);
        const rows = Math.max(Math.floor((circuitState.height - padding * 2) / spacing), 4);
        const grid = [];
        const nodes = [];

        for (let row = 0; row <= rows; row += 1) {
          grid[row] = [];
          for (let column = 0; column <= columns; column += 1) {
            const density = row === 0 || column === 0 || row === rows || column === columns ? 0.7 : 0.84;
            if (Math.random() > density) {
              grid[row][column] = null;
              continue;
            }

            const x = padding + column * spacing + randomBetween(-18, 18);
            const y = padding + row * spacing + randomBetween(-18, 18);
            const isHub = Math.random() > 0.82;
            const node = {
              id: `circuit-${row}-${column}`,
              row,
              column,
              x,
              y,
              radius: isHub ? randomBetween(2.6, 3.4) : randomBetween(1.2, 2.2),
              hub: isHub
            };

            grid[row][column] = node;
            nodes.push(node);
          }
        }

        const findNeighbor = (row, column, deltaRow, deltaColumn, reach = 2) => {
          for (let step = 1; step <= reach; step += 1) {
            const nextRow = row + deltaRow * step;
            const nextColumn = column + deltaColumn * step;
            const candidate = grid[nextRow] && grid[nextRow][nextColumn];
            if (candidate) {
              return candidate;
            }
          }
          return null;
        };

        const connections = [];
        nodes.forEach((node) => {
          const rightNode = findNeighbor(node.row, node.column, 0, 1);
          const downNode = findNeighbor(node.row, node.column, 1, 0);

          if (rightNode && Math.random() < 0.82) {
            connections.push({
              from: node,
              to: rightNode,
              ...buildConnectionGeometry(createTracePoints(node, rightNode))
            });
          }

          if (downNode && Math.random() < 0.74) {
            connections.push({
              from: node,
              to: downNode,
              ...buildConnectionGeometry(createTracePoints(node, downNode))
            });
          }
        });

        circuitState.nodes = nodes;
        circuitState.connections = connections;
        circuitState.pulses = motionPreference.matches
          ? []
          : Array.from(
              { length: Math.min(18, Math.max(8, Math.round(connections.length * 0.18))) },
              () => createPulse()
            ).filter(Boolean);
      };

      const drawCircuitBackground = (deltaTime, timestamp) => {
        circuitContext.setTransform(circuitState.dpr, 0, 0, circuitState.dpr, 0, 0);
        circuitContext.clearRect(0, 0, circuitState.width, circuitState.height);

        const pointerVisible = !motionPreference.matches && pointerState.active && timestamp - pointerState.movedAt < 1800;
        const pointerRadius = circuitState.width < 720 ? 108 : 150;

        circuitContext.fillStyle = circuitState.palette.grid;
        for (let x = 28; x < circuitState.width; x += 92) {
          for (let y = 24; y < circuitState.height; y += 92) {
            circuitContext.fillRect(x, y, 1.4, 1.4);
          }
        }

        circuitState.connections.forEach((connection) => {
          const proximity = pointerVisible
            ? Math.max(
                0,
                1 - Math.min(
                  Math.hypot(pointerState.x - connection.from.x, pointerState.y - connection.from.y),
                  Math.hypot(pointerState.x - connection.to.x, pointerState.y - connection.to.y),
                  Math.hypot(pointerState.x - connection.midpoint.x, pointerState.y - connection.midpoint.y)
                ) / pointerRadius
              )
            : 0;

          traceConnectionPath(connection);
          circuitContext.strokeStyle = proximity > 0 ? circuitState.palette.lineStrong : circuitState.palette.line;
          circuitContext.lineWidth = proximity > 0 ? 1.4 + proximity * 0.8 : 1;
          circuitContext.shadowBlur = proximity > 0 ? 14 * proximity : 0;
          circuitContext.shadowColor = circuitState.palette.lineStrong;
          circuitContext.stroke();
        });

        circuitState.nodes.forEach((node) => {
          const proximity = pointerVisible
            ? Math.max(0, 1 - Math.hypot(pointerState.x - node.x, pointerState.y - node.y) / pointerRadius)
            : 0;
          const glowRadius = node.radius + 6 + proximity * 12;

          circuitContext.shadowBlur = 0;
          circuitContext.globalAlpha = 0.16 + proximity * 0.24;
          circuitContext.fillStyle = circuitState.palette.nodeSoft;
          circuitContext.beginPath();
          circuitContext.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
          circuitContext.fill();

          circuitContext.globalAlpha = 1;
          circuitContext.shadowBlur = 10 + proximity * 18;
          circuitContext.shadowColor = circuitState.palette.pulse;
          circuitContext.fillStyle = circuitState.palette.node;
          circuitContext.beginPath();
          circuitContext.arc(node.x, node.y, node.radius + proximity * 1.5, 0, Math.PI * 2);
          circuitContext.fill();

          if (node.hub) {
            circuitContext.lineWidth = 1;
            circuitContext.strokeStyle = circuitState.palette.lineStrong;
            circuitContext.beginPath();
            circuitContext.arc(node.x, node.y, node.radius + 4 + proximity * 2, 0, Math.PI * 2);
            circuitContext.stroke();
          }
        });

        circuitContext.shadowBlur = 0;
        if (!motionPreference.matches) {
          circuitState.pulses.forEach((pulse) => {
            pulse.distance += pulse.speed * deltaTime;
            if (pulse.distance > pulse.connection.totalLength + 22) {
              resetPulse(pulse);
            }

            const point = getPointOnSegments(pulse.connection.segments, pulse.distance);
            circuitContext.globalAlpha = pulse.alpha;
            circuitContext.shadowBlur = 22;
            circuitContext.shadowColor = circuitState.palette.pulse;
            circuitContext.fillStyle = circuitState.palette.pulse;
            circuitContext.beginPath();
            circuitContext.arc(point.x, point.y, pulse.radius, 0, Math.PI * 2);
            circuitContext.fill();
          });
        }

        circuitContext.globalAlpha = 1;
        circuitContext.shadowBlur = 0;
      };

      const renderCircuitFrame = (timestamp) => {
        const deltaTime = circuitState.lastTime
          ? Math.min((timestamp - circuitState.lastTime) / 1000, 0.04)
          : 0.016;
        circuitState.lastTime = timestamp;
        drawCircuitBackground(deltaTime, timestamp);

        if (!motionPreference.matches && !document.hidden) {
          circuitState.frameId = window.requestAnimationFrame(renderCircuitFrame);
        } else {
          circuitState.frameId = 0;
        }
      };

      const stopCircuitLoop = () => {
        if (!circuitState.frameId) {
          return;
        }

        window.cancelAnimationFrame(circuitState.frameId);
        circuitState.frameId = 0;
      };

      const startCircuitLoop = () => {
        if (motionPreference.matches || document.hidden || circuitState.frameId) {
          return;
        }

        circuitState.lastTime = 0;
        circuitState.frameId = window.requestAnimationFrame(renderCircuitFrame);
      };

      const rebuildCircuitBackground = () => {
        stopCircuitLoop();
        regenerateCircuit();
        drawCircuitBackground(0, performance.now());
        startCircuitLoop();
      };

      refreshCircuitTheme = () => {
        circuitState.palette = readCircuitPalette();
        drawCircuitBackground(0, performance.now());
      };

      const handleCircuitPointer = (event) => {
        if (motionPreference.matches || event.pointerType === "touch") {
          return;
        }

        pointerState.x = event.clientX;
        pointerState.y = event.clientY;
        pointerState.active = true;
        pointerState.movedAt = performance.now();
        startCircuitLoop();
      };

      window.addEventListener("pointermove", handleCircuitPointer, { passive: true });
      window.addEventListener("pointerdown", handleCircuitPointer, { passive: true });
      window.addEventListener("resize", rebuildCircuitBackground);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          stopCircuitLoop();
          return;
        }

        drawCircuitBackground(0, performance.now());
        startCircuitLoop();
      });

      if (typeof motionPreference.addEventListener === "function") {
        motionPreference.addEventListener("change", rebuildCircuitBackground);
      } else if (typeof motionPreference.addListener === "function") {
        motionPreference.addListener(rebuildCircuitBackground);
      }

      rebuildCircuitBackground();
    }
  }

  const revealNodes = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealNodes.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    revealNodes.forEach((node) => observer.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  }

  if (journeyTimeline && timelineRailFill && timelineItems.length) {
    const updateTimelineState = () => {
      const viewportAnchor = window.innerHeight * 0.42;
      const timelineRect = journeyTimeline.getBoundingClientRect();
      const travelSpace = Math.max(journeyTimeline.offsetHeight - window.innerHeight * 0.35, 1);
      const covered = viewportAnchor - timelineRect.top;
      const progress = Math.min(Math.max(covered / travelSpace, 0), 1);
      timelineRailFill.style.transform = `scaleY(${progress})`;

      let activeItem = timelineRect.bottom < viewportAnchor
        ? timelineItems[timelineItems.length - 1]
        : timelineItems[0];
      let minDistance = Number.POSITIVE_INFINITY;

      timelineItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - viewportAnchor);
        const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;

        if (isVisible && distance < minDistance) {
          minDistance = distance;
          activeItem = item;
        }
      });

      timelineItems.forEach((item) => {
        item.classList.toggle("is-active", item === activeItem);
      });
    };

    let timelineTicking = false;
    const requestTimelineUpdate = () => {
      if (timelineTicking) {
        return;
      }

      timelineTicking = true;
      window.requestAnimationFrame(() => {
        updateTimelineState();
        timelineTicking = false;
      });
    };

    updateTimelineState();
    window.addEventListener("scroll", requestTimelineUpdate, { passive: true });
    window.addEventListener("resize", requestTimelineUpdate);
  }

  if (
    photoFlipCard &&
    profilePhotoTrigger &&
    chessCloseBtn &&
    chessModeOverlay &&
    playVsComputerBtn &&
    playVsHumanBtn &&
    chessModeTitle &&
    heroChessUi &&
    heroChessBoard &&
    chessStatus &&
    chessModeBadge &&
    chessResetBtn
  ) {
    const gameState = {
      mode: "",
      board: Array(9).fill(""),
      currentTurn: "X",
      isOver: false,
      aiTimerId: null
    };
    let flipReadyTimerId = null;
    const winningLines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];

    const updateGameStatus = (message) => {
      chessStatus.textContent = message;
    };

    const clearAiTimer = () => {
      if (gameState.aiTimerId) {
        window.clearTimeout(gameState.aiTimerId);
        gameState.aiTimerId = null;
      }
    };

    const getWinnerInfo = (board) => {
      for (const line of winningLines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return { winner: board[a], line };
        }
      }

      if (board.every((cell) => cell)) {
        return { winner: "draw", line: [] };
      }
      return null;
    };

    const getAvailableMoves = (board) => {
      const moves = [];
      board.forEach((cell, index) => {
        if (!cell) {
          moves.push(index);
        }
      });
      return moves;
    };

    const findBestTacticalMove = (board, player) => {
      for (const move of getAvailableMoves(board)) {
        const clone = [...board];
        clone[move] = player;
        const winnerInfo = getWinnerInfo(clone);
        if (winnerInfo && winnerInfo.winner === player) {
          return move;
        }
      }
      return null;
    };

    const chooseComputerMove = () => {
      const board = gameState.board;
      const winMove = findBestTacticalMove(board, "O");
      if (winMove !== null) {
        return winMove;
      }

      const blockMove = findBestTacticalMove(board, "X");
      if (blockMove !== null) {
        return blockMove;
      }

      if (!board[4]) {
        return 4;
      }

      const corners = [0, 2, 6, 8].filter((index) => !board[index]);
      if (corners.length) {
        return corners[Math.floor(Math.random() * corners.length)];
      }

      const remaining = getAvailableMoves(board);
      if (!remaining.length) {
        return null;
      }
      return remaining[Math.floor(Math.random() * remaining.length)];
    };

    const getTurnMessage = () => {
      if (gameState.isOver) {
        const winnerInfo = getWinnerInfo(gameState.board);
        if (winnerInfo && winnerInfo.winner === "draw") {
          return "Draw game.";
        }
        if (winnerInfo && winnerInfo.winner) {
          return `${winnerInfo.winner} wins.`;
        }
        return "Game over.";
      }

      if (gameState.mode === "computer" && gameState.currentTurn === "O") {
        return "Computer thinking...";
      }

      return `${gameState.currentTurn} to move.`;
    };

    const renderBoard = (winnerLine = []) => {
      if (!heroChessBoard) {
        return;
      }

      heroChessBoard.innerHTML = "";
      const highlighted = new Set(winnerLine);

      gameState.board.forEach((value, index) => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "kitkat-cell";
        cell.dataset.index = String(index);
        cell.textContent = value || "";
        cell.setAttribute("aria-label", value ? `Cell ${index + 1}: ${value}` : `Cell ${index + 1}`);
        if (value === "X") {
          cell.classList.add("is-x");
        } else if (value === "O") {
          cell.classList.add("is-o");
        }
        if (highlighted.has(index)) {
          cell.classList.add("is-win");
        }
        if (gameState.isOver || !!value || (gameState.mode === "computer" && gameState.currentTurn === "O")) {
          cell.disabled = true;
        }
        heroChessBoard.appendChild(cell);
      });
    };

    const finishTurn = () => {
      const winnerInfo = getWinnerInfo(gameState.board);
      if (!winnerInfo) {
        updateGameStatus(getTurnMessage());
        renderBoard();
        return false;
      }

      gameState.isOver = true;
      renderBoard(winnerInfo.line);
      if (winnerInfo.winner === "draw") {
        updateGameStatus("Draw game.");
      } else {
        updateGameStatus(`${winnerInfo.winner} wins.`);
      }
      return true;
    };

    const runComputerTurn = () => {
      if (gameState.mode !== "computer" || gameState.isOver || gameState.currentTurn !== "O") {
        return;
      }

      updateGameStatus("Computer thinking...");
      clearAiTimer();

      gameState.aiTimerId = window.setTimeout(() => {
        const move = chooseComputerMove();
        if (move === null || gameState.isOver) {
          return;
        }

        gameState.board[move] = "O";
        if (!finishTurn()) {
          gameState.currentTurn = "X";
          updateGameStatus(getTurnMessage());
          renderBoard();
        }
        gameState.aiTimerId = null;
      }, 260);
    };

    const handleCellClick = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.classList.contains("kitkat-cell")) {
        return;
      }

      const index = Number(target.dataset.index);
      if (!Number.isInteger(index) || index < 0 || index > 8) {
        return;
      }

      if (gameState.isOver || gameState.board[index]) {
        return;
      }

      if (gameState.mode === "computer" && gameState.currentTurn === "O") {
        return;
      }

      gameState.board[index] = gameState.currentTurn;
      if (finishTurn()) {
        return;
      }

      gameState.currentTurn = gameState.currentTurn === "X" ? "O" : "X";
      updateGameStatus(getTurnMessage());
      renderBoard();

      if (gameState.mode === "computer" && gameState.currentTurn === "O") {
        runComputerTurn();
      }
    };

    const startGame = (mode) => {
      gameState.mode = mode;
      gameState.board = Array(9).fill("");
      gameState.currentTurn = "X";
      gameState.isOver = false;
      clearAiTimer();

      chessModeTitle.textContent = "Choose Your Kit Kat Mode";
      chessModeBadge.textContent = mode === "computer" ? "Kit Kat vs Computer" : "Kit Kat 2-Player";
      chessModeOverlay.classList.add("is-hidden");
      heroChessUi.classList.add("is-visible");
      updateGameStatus("X to move.");
      renderBoard();
    };

    const resetGame = () => {
      if (!gameState.mode) {
        return;
      }
      startGame(gameState.mode);
    };

    const closeGamePanel = () => {
      clearAiTimer();
      if (flipReadyTimerId) {
        window.clearTimeout(flipReadyTimerId);
        flipReadyTimerId = null;
      }
      gameState.mode = "";
      gameState.board = Array(9).fill("");
      gameState.currentTurn = "X";
      gameState.isOver = false;
      heroChessBoard.innerHTML = "";

      heroChessUi.classList.remove("is-visible");
      chessModeOverlay.classList.remove("is-hidden");
      chessModeTitle.textContent = "Choose Your Kit Kat Mode";
      photoFlipCard.classList.remove("is-ready");
      photoFlipCard.classList.remove("is-flipped");
      updateGameStatus("Select a mode to start.");
    };

    profilePhotoTrigger.addEventListener("click", () => {
      photoFlipCard.classList.add("is-flipped");
      if (flipReadyTimerId) {
        window.clearTimeout(flipReadyTimerId);
      }
      flipReadyTimerId = window.setTimeout(() => {
        if (photoFlipCard.classList.contains("is-flipped")) {
          photoFlipCard.classList.add("is-ready");
        }
      }, 760);
    });

    photoFlipCard.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "transform") {
        return;
      }

      if (photoFlipCard.classList.contains("is-flipped")) {
        photoFlipCard.classList.add("is-ready");
        if (flipReadyTimerId) {
          window.clearTimeout(flipReadyTimerId);
          flipReadyTimerId = null;
        }
        return;
      }

      photoFlipCard.classList.remove("is-ready");
    });

    playVsComputerBtn.addEventListener("click", (event) => {
      event.preventDefault();
      startGame("computer");
    });

    playVsHumanBtn.addEventListener("click", (event) => {
      event.preventDefault();
      startGame("human");
    });

    chessResetBtn.addEventListener("click", () => {
      resetGame();
    });

    chessCloseBtn.addEventListener("click", () => {
      closeGamePanel();
    });

    heroChessBoard.addEventListener("click", handleCellClick);
  }

  if (localClock) {
    const renderClock = () => {
      localClock.textContent = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
      });
    };

    renderClock();
    window.setInterval(renderClock, 30000);
  }

  if (orbitPanel && orbitSystem && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let orbitFrameId = 0;

    const applyOrbitState = (xPercent, yPercent) => {
      const clampedX = Math.min(Math.max(xPercent, 0), 100);
      const clampedY = Math.min(Math.max(yPercent, 0), 100);
      const tiltY = (clampedX - 50) / 8;
      const tiltX = (50 - clampedY) / 10;

      orbitPanel.style.setProperty("--orbit-pointer-x", `${clampedX}%`);
      orbitPanel.style.setProperty("--orbit-pointer-y", `${clampedY}%`);
      orbitPanel.style.setProperty("--orbit-tilt-x", `${tiltX.toFixed(2)}deg`);
      orbitPanel.style.setProperty("--orbit-tilt-y", `${tiltY.toFixed(2)}deg`);
    };

    const scheduleOrbitState = (xPercent, yPercent) => {
      if (orbitFrameId) {
        window.cancelAnimationFrame(orbitFrameId);
      }

      orbitFrameId = window.requestAnimationFrame(() => {
        applyOrbitState(xPercent, yPercent);
        orbitFrameId = 0;
      });
    };

    const resetOrbitState = () => {
      scheduleOrbitState(50, 46);
    };

    resetOrbitState();

    orbitPanel.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") {
        return;
      }

      const bounds = orbitPanel.getBoundingClientRect();
      const xPercent = ((event.clientX - bounds.left) / bounds.width) * 100;
      const yPercent = ((event.clientY - bounds.top) / bounds.height) * 100;
      scheduleOrbitState(xPercent, yPercent);
    });

    orbitPanel.addEventListener("pointerleave", resetOrbitState);
    orbitPanel.addEventListener("pointercancel", resetOrbitState);
    orbitPanel.addEventListener("focusout", (event) => {
      if (event.relatedTarget instanceof Node && orbitPanel.contains(event.relatedTarget)) {
        return;
      }

      resetOrbitState();
    });
  }

  if (skillTreeStage && skillTreeLines && skillTreeNodes.length) {
    const svgNs = "http://www.w3.org/2000/svg";
    const skillBranchLabels = {
      all: "Core Path",
      web: "Web Path",
      cyber: "Cyber Path",
      embedded: "Embedded Path"
    };
    const skillTreeConnections = [
      { from: "technology", to: "web-development", branch: "web" },
      { from: "web-development", to: "html", branch: "web" },
      { from: "web-development", to: "css", branch: "web" },
      { from: "web-development", to: "javascript", branch: "web" },
      { from: "technology", to: "cybersecurity", branch: "cyber" },
      { from: "cybersecurity", to: "network-security", branch: "cyber" },
      { from: "technology", to: "embedded-systems", branch: "embedded" },
      { from: "embedded-systems", to: "arduino", branch: "embedded" }
    ];
    const skillNodeMap = new Map(
      skillTreeNodes.map((node) => [node.dataset.node || "", node])
    );
    const defaultSkillNode = skillNodeMap.get("technology") || skillTreeNodes[0];
    let skillTreeFrameId = 0;
    let activeSkillNodeId = "";
    let skillTreeLinks = [];

    const createSkillSvg = (tagName, className) => {
      const element = document.createElementNS(svgNs, tagName);
      if (className) {
        element.setAttribute("class", className);
      }
      return element;
    };

    const getSkillNodeCenter = (node, stageRect) => {
      const rect = node.getBoundingClientRect();
      return {
        x: rect.left - stageRect.left + rect.width / 2,
        y: rect.top - stageRect.top + rect.height / 2
      };
    };

    const buildSkillTreePath = (start, end) => {
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;

      if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        const bend = Math.max(Math.abs(deltaX) * 0.38, 54);
        const directionX = Math.sign(deltaX || 1);
        return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} C ${(start.x + directionX * bend).toFixed(1)} ${start.y.toFixed(1)}, ${(end.x - directionX * bend).toFixed(1)} ${end.y.toFixed(1)}, ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
      }

      const bend = Math.max(Math.abs(deltaY) * 0.34, 54);
      const directionY = Math.sign(deltaY || 1);
      return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} C ${start.x.toFixed(1)} ${(start.y + directionY * bend).toFixed(1)}, ${end.x.toFixed(1)} ${(end.y - directionY * bend).toFixed(1)}, ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
    };

    const getSkillNodeMeta = (node) => {
      const tooltip = node.querySelector(".tree-tooltip");
      const title = tooltip?.querySelector("strong")?.textContent?.trim()
        || node.querySelector(".tree-node-title")?.textContent?.trim()
        || "Technology";
      const description = tooltip?.querySelector(".tree-tooltip > span")?.textContent?.trim()
        || "Current learning base across web development, cybersecurity, and embedded systems.";
      const status = tooltip?.querySelector(".tree-tooltip-status")?.textContent?.trim() || "Currently Learning";
      const branchKey = node.dataset.branch || "all";
      const typeLabel = node.classList.contains("tree-node-core")
        ? "Core Node"
        : node.classList.contains("tree-node-branch")
          ? "Branch Node"
          : "Skill Node";

      return {
        title,
        description,
        status,
        branchKey,
        branchLabel: skillBranchLabels[branchKey] || "Learning Path",
        typeLabel
      };
    };

    const updateTreeFocusPanel = (node) => {
      if (!treeFocusPanel || !treeFocusTitle || !treeFocusDescription || !treeFocusBranch || !treeFocusType || !treeFocusStatus) {
        return;
      }

      const meta = getSkillNodeMeta(node || defaultSkillNode);
      treeFocusTitle.textContent = meta.title;
      treeFocusDescription.textContent = meta.description;
      treeFocusBranch.textContent = meta.branchLabel;
      treeFocusType.textContent = meta.typeLabel;
      treeFocusStatus.textContent = meta.status;
      treeFocusPanel.dataset.branch = meta.branchKey;
    };

    const syncSkillTreeState = () => {
      const activeNode = activeSkillNodeId ? skillNodeMap.get(activeSkillNodeId) : null;
      const activeBranch = activeNode ? activeNode.dataset.branch || "" : "";

      skillTreeNodes.forEach((node) => {
        const branch = node.dataset.branch || "";
        const isRelevant = !activeNode || activeBranch === "all" || branch === activeBranch || branch === "all";
        node.classList.toggle("is-active", !!activeNode && node === activeNode);
        node.classList.toggle("is-dim", !!activeNode && !isRelevant);
      });

      skillTreeLinks.forEach(({ group, branch }) => {
        const isRelevant = !activeNode || activeBranch === "all" || branch === activeBranch;
        group.classList.toggle("is-active", !!activeNode && isRelevant);
        group.classList.toggle("is-dim", !!activeNode && !isRelevant);
      });
    };

    const drawSkillTree = () => {
      const stageRect = skillTreeStage.getBoundingClientRect();
      const width = Math.max(skillTreeStage.clientWidth, 1);
      const height = Math.max(skillTreeStage.clientHeight, 1);

      skillTreeLines.setAttribute("viewBox", `0 0 ${width} ${height}`);
      skillTreeLines.setAttribute("width", String(width));
      skillTreeLines.setAttribute("height", String(height));
      skillTreeLines.innerHTML = "";
      skillTreeLinks = [];

      skillTreeConnections.forEach(({ from, to, branch }) => {
        const startNode = skillNodeMap.get(from);
        const endNode = skillNodeMap.get(to);
        if (!startNode || !endNode) {
          return;
        }

        const pathData = buildSkillTreePath(
          getSkillNodeCenter(startNode, stageRect),
          getSkillNodeCenter(endNode, stageRect)
        );
        const group = createSkillSvg("g", "tree-link-group");
        const glowPath = createSkillSvg("path", "tree-link-glow");
        const basePath = createSkillSvg("path", "tree-link-base");
        const flowPath = createSkillSvg("path", "tree-link-flow");

        glowPath.setAttribute("d", pathData);
        basePath.setAttribute("d", pathData);
        flowPath.setAttribute("d", pathData);
        group.dataset.branch = branch;
        group.append(glowPath, basePath, flowPath);
        skillTreeLines.appendChild(group);
        skillTreeLinks.push({ group, branch });
      });

      syncSkillTreeState();
    };

    const requestSkillTreeDraw = () => {
      if (skillTreeFrameId) {
        return;
      }

      skillTreeFrameId = window.requestAnimationFrame(() => {
        drawSkillTree();
        skillTreeFrameId = 0;
      });
    };

    const setActiveSkillNode = (node) => {
      activeSkillNodeId = node ? node.dataset.node || "" : "";
      syncSkillTreeState();
      updateTreeFocusPanel(node);
    };

    skillTreeNodes.forEach((node) => {
      node.addEventListener("pointerenter", () => {
        setActiveSkillNode(node);
      });

      node.addEventListener("focus", () => {
        setActiveSkillNode(node);
      });

      node.addEventListener("click", () => {
        setActiveSkillNode(node);
      });
    });

    skillTreeStage.addEventListener("pointerleave", () => {
      setActiveSkillNode(null);
    });

    skillTreeStage.addEventListener("focusout", (event) => {
      if (event.relatedTarget instanceof Node && skillTreeStage.contains(event.relatedTarget)) {
        return;
      }

      setActiveSkillNode(null);
    });

    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Node) || skillTreeStage.contains(event.target)) {
        return;
      }

      setActiveSkillNode(null);
    });

    updateTreeFocusPanel(null);
    requestSkillTreeDraw();
    window.addEventListener("resize", requestSkillTreeDraw);

    if ("ResizeObserver" in window) {
      const skillTreeResizeObserver = new ResizeObserver(() => {
        requestSkillTreeDraw();
      });

      skillTreeResizeObserver.observe(skillTreeStage);
      skillTreeNodes.forEach((node) => {
        skillTreeResizeObserver.observe(node);
      });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        requestSkillTreeDraw();
      }).catch(() => {});
    }
  }

  if (filterButtons.length && projectCards.length) {
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter || "all";

        filterButtons.forEach((btn) => {
          const isActive = btn === button;
          btn.classList.toggle("active", isActive);
          btn.setAttribute("aria-pressed", String(isActive));
        });

        projectCards.forEach((card) => {
          const category = card.dataset.category || "";
          const shouldShow = filter === "all" || category === filter;
          card.classList.toggle("is-hidden", !shouldShow);
        });
      });
    });
  }

  const setCopyStatus = (message, type = "") => {
    if (!copyStatus) {
      return;
    }

    copyStatus.textContent = message;
    copyStatus.classList.remove("success", "error");
    if (type) {
      copyStatus.classList.add(type);
    }
  };

  const fallbackCopyText = (value) => {
    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "readonly");
    helper.style.position = "absolute";
    helper.style.left = "-9999px";
    document.body.appendChild(helper);
    helper.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(helper);
    return copied;
  };

  if (copyEmailBtn && emailLink) {
    copyEmailBtn.addEventListener("click", async () => {
      const email = emailLink.textContent ? emailLink.textContent.trim() : "";
      if (!email) {
        setCopyStatus("Email not available.", "error");
        return;
      }

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
        } else {
          const copied = fallbackCopyText(email);
          if (!copied) {
            throw new Error("Fallback copy failed");
          }
        }

        setCopyStatus("Email copied to clipboard.", "success");
      } catch (error) {
        setCopyStatus("Could not copy email. Please copy manually.", "error");
      }
    });
  }

  const setFormStatus = (message, type = "") => {
    if (!statusEl) {
      return;
    }

    statusEl.textContent = message;
    statusEl.classList.remove("success", "error");
    if (type) {
      statusEl.classList.add(type);
    }
  };

  if (window.emailjs) {
    try {
      window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
    } catch (error) {
      setFormStatus("Email service initialization failed. Please use direct email.", "error");
    }
  }

  if (!contactForm) {
    return;
  }

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const message = messageInput ? messageInput.value.trim() : "";

    if (!name || !email || !message) {
      setFormStatus("Please fill all required fields.", "error");
      return;
    }

    const submitButton = contactForm.querySelector("button[type='submit']");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    if (!window.emailjs) {
      setFormStatus("Email service is unavailable right now. Please use the email link above.", "error");
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Message";
      }
      return;
    }

    try {
      await window.emailjs.send(EMAILJS_CONFIG.serviceID, EMAILJS_CONFIG.templateID, {
        name,
        email,
        message,
        sent_at: new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short"
        })
      });

      contactForm.reset();
      setFormStatus("Message sent successfully. I will reply soon.", "success");
    } catch (error) {
      setFormStatus("Could not send your message. Please try again or email directly.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Message";
      }
    }
  });
})();
