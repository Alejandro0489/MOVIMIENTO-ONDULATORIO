import subprocess, time, json, urllib.request, os

edge = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
port = 9228
cwd = os.getcwd()
file_url = 'file:///' + cwd.replace('\\', '/') + '/test_p2.html'

proc = subprocess.Popen([
    edge,
    '--headless',
    '--remote-debugging-port=' + str(port),
    '--disable-gpu',
    file_url
])
time.sleep(2.0)

try:
    tabs = json.loads(urllib.request.urlopen(f'http://127.0.0.1:{port}/json').read())
    target = tabs[0]
    for t in tabs:
        if 'test_p2.html' in t.get('url', ''):
            target = t
            break
    ws_url = target.get('webSocketDebuggerUrl')
    print('Tab URL:', target.get('url'))
finally:
    proc.terminate()

