function buildDomTree() {
    try {
        // 노드를 처리하는 재귀 함수
        function processNode(node, parentPath = '') {
            if (!node) return null;
            
            // 기본 노드 속성 추출
            let tag = node.tagName ? node.tagName.toLowerCase() : '';
            if (!tag && node.nodeType === 3) tag = '#text';
            
            // XPath 계산
            let xpath = parentPath;
            if (tag && tag !== '#text') {
                let index = 1;
                let sibling = node.previousElementSibling;
                while (sibling) {
                    if (sibling.tagName.toLowerCase() === tag) index++;
                    sibling = sibling.previousElementSibling;
                }
                xpath = xpath + '/' + tag + '[' + index + ']';
            }
            
            // 노드 정보 객체 생성
            const result = {
                tag: tag,
                text: node.nodeType === 3 ? node.textContent.trim() : '',
                xpath: xpath,
                attributes: {},
                children: [],
                isClickable: false
            };
            
            // 속성 추출
            if (node.attributes) {
                for (let i = 0; i < node.attributes.length; i++) {
                    const attr = node.attributes[i];
                    result.attributes[attr.name] = attr.value;
                }
            }
            
            // 클릭 가능 여부 확인
            if (tag) {
                if (tag === 'a' || tag === 'button' || 
                    (tag === 'input' && ['button', 'submit', 'reset', 'checkbox', 'radio'].includes(node.type)) ||
                    node.getAttribute('role') === 'button' ||
                    (node.onclick != null) ||
                    (getComputedStyle(node).cursor === 'pointer' && getComputedStyle(node).pointerEvents !== 'none')) {
                    result.isClickable = true;
                }
            }
            
            // 자식 노드 처리
            if (node.childNodes) {
                for (let i = 0; i < node.childNodes.length; i++) {
                    const child = node.childNodes[i];
                    // 의미 있는 텍스트 노드이거나 요소 노드인 경우만 처리
                    if (child.nodeType === 1 || (child.nodeType === 3 && child.textContent.trim() !== '')) {
                        const childResult = processNode(child, xpath);
                        if (childResult) {
                            result.children.push(childResult);
                        }
                    }
                }
            }
            
            return result;
        }
        
        // document.body에서 시작하여 DOM 트리 구축
        return processNode(document.body, '');
    } catch (error) {
        console.error('Error in buildDomTree:', error);
        return {
            tag: 'body',
            text: 'Error processing DOM: ' + error.message,
            xpath: '/body',
            attributes: {},
            children: [],
            isClickable: false
        };
    }
}