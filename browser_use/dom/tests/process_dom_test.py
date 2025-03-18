import json
import os
import sys
import time

# 프로젝트 루트 경로 추가 (3단계 상위 디렉토리)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from browser_use.browser.browser import Browser, BrowserConfig

async def test_process_dom():
    browser = Browser(config=BrowserConfig(headless=False))
    async with await browser.new_context() as context:
        page = await context.get_current_page()
        # await page.goto('https://kayak.com/flights')
        # await page.goto('https://google.com/flights')
        await page.goto('https://immobilienscout24.de')
        # await page.goto('https://seleniumbase.io/w3schools/iframes')
        time.sleep(3)
        with open('browser_use/dom/buildDomTree.js', 'r') as f:
            js_code = f.read()
        start = time.time()
        dom_tree = await page.evaluate(js_code)
        end = time.time()
        # print(dom_tree)
        print(f'Time: {end - start:.2f}s')
        os.makedirs('./tmp', exist_ok=True)
        with open('./tmp/dom.json', 'w') as f:
            json.dump(dom_tree, f, indent=1)
        # both of these work for immobilienscout24.de
        # await page.click('.sc-dcJsrY.ezjNCe')
        # await page.click(
        #   'div > div:nth-of-type(2) > div > div:nth-of-type(2) > div > div:nth-of-type(2) > div > div > div > button:nth-of-type(2)'
        # )
        input('Press Enter to continue...')

if __name__ == '__main__':
    import asyncio
    asyncio.run(test_process_dom())