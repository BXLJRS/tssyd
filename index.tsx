
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Twosome Manager Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Noto Sans KR', sans-serif;
            background-color: #ffffff;
            -webkit-tap-highlight-color: transparent;
        }
        /* 입력창 포커스 시 자동 줌 방지 */
        input, select, textarea {
            font-size: 16px !important;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .pb-safe {
            padding-bottom: env(safe-area-inset-bottom);
        }
        /* 모바일에서 배경이 짤리지 않게 처리 */
        .min-h-screen-ios {
            min-height: -webkit-fill-available;
        }
    </style>
<script type="importmap">
{
  "imports": {
    "react-dom/": "https://esm.sh/react-dom@^19.2.4/",
    "lucide-react": "https://esm.sh/lucide-react@^0.563.0",
    "react/": "https://esm.sh/react@^19.2.4/",
    "react": "https://esm.sh/react@^19.2.4",
    "react-router-dom": "https://esm.sh/react-router-dom@^7.13.0"
  }
}
</script>
</head>
<body class="select-none overflow-x-hidden">
    <div id="root"></div>
</body>
</html>
