#!/bin/sh
# macOS 26+ Gatekeeper는 Electron 공식 배포본의 ad-hoc linker-signed 바이너리를
# 서명 불량으로 보고 실행 즉시 종료시킨다(SIGKILL, "휴지통으로 이동" 경고).
# 번들 전체를 ad-hoc 재서명하면 정상 실행된다. npm install 뒤 postinstall에서 호출.
set -eu

[ "$(uname)" = "Darwin" ] || exit 0

APP="node_modules/electron/dist/Electron.app"
[ -d "$APP" ] || exit 0

if codesign --verify --deep --strict "$APP" 2>/dev/null; then
  exit 0
fi

echo "sign-electron: re-signing $APP (ad-hoc)"
codesign --force --deep --sign - "$APP"
