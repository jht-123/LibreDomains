// 查询页面专用 JavaScript 文件
document.addEventListener('DOMContentLoaded', function() {
    // 初始化查询页面功能
    initQuerySystem();
    initSuggestions();
    initHistory();
    updateStats();
});

let currentTab = 'availability';
let queryHistory = JSON.parse(localStorage.getItem('queryHistory') || '[]');

// 初始化查询系统
function initQuerySystem() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const subdomainInput = document.getElementById('subdomainInput');
    const domainSelect = document.getElementById('domainSelect');
    const queryBtn = document.getElementById('queryBtn');
    const queryResults = document.getElementById('queryResults');

    // 标签页切换
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentTab = this.getAttribute('data-tab');

            // 更新占位符文本
            updatePlaceholder();
        });
    });

    // 输入验证
    if (subdomainInput) {
        subdomainInput.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            this.value = value;

            // 实时验证
            validateSubdomainInput(this, value);
        });

        subdomainInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performQuery();
            }
        });
    }

    // 查询按钮
    if (queryBtn) {
        queryBtn.addEventListener('click', performQuery);
    }

    // 执行查询
    function performQuery() {
        const subdomain = subdomainInput.value.trim().toLowerCase();
        const domain = domainSelect.value;

        if (!LibreDomains.validateSubdomain(subdomain)) {
            showError('请输入有效的子域名');
            return;
        }

        const fullDomain = subdomain + '.' + domain;

        // 显示加载状态
        showLoading();

        // 添加到历史记录
        addToHistory(fullDomain, currentTab);

        // 根据当前标签页执行不同的查询
        switch (currentTab) {
            case 'availability':
                checkAvailability(fullDomain, subdomain, domain);
                break;
            case 'whois':
                performWhoisQuery(fullDomain);
                break;
            case 'dns':
                performDnsQuery(fullDomain);
                break;
        }

        // 更新统计
        updateQueryCount();
    }

    // 更新占位符
    function updatePlaceholder() {
        if (!subdomainInput) return;

        switch (currentTab) {
            case 'availability':
                subdomainInput.placeholder = '输入子域名检查可用性';
                break;
            case 'whois':
                subdomainInput.placeholder = '输入子域名查看WHOIS信息';
                break;
            case 'dns':
                subdomainInput.placeholder = '输入子域名查看DNS记录';
                break;
        }
    }
}

// 验证子域名输入
function validateSubdomainInput(input, value) {
    const inputWrapper = input.closest('.input-wrapper');

    // 移除之前的状态
    input.classList.remove('error', 'success');

    if (!value) {
        return;
    }

    if (LibreDomains.validateSubdomain(value)) {
        input.classList.add('success');
    } else {
        input.classList.add('error');
    }
}

// 显示加载状态
function showLoading() {
    const queryResults = document.getElementById('queryResults');
    queryResults.innerHTML = `
        <div class="result-loading">
            <div class="loading-animation">
                <div class="loading-spinner"></div>
                <div class="loading-waves">
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                </div>
            </div>
            <h3>正在查询中...</h3>
            <p>请稍候，正在获取域名信息</p>
        </div>
    `;
}

// 显示错误
function showError(message) {
    const queryResults = document.getElementById('queryResults');
    queryResults.innerHTML = `
        <div class="result-error">
            <div class="result-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>查询失败</h3>
            <p>${message}</p>
        </div>
    `;
}

// 检查可用性
function checkAvailability(fullDomain, subdomain, domain) {
    // 模拟API调用
    setTimeout(() => {
        const isAvailable = !checkIfDomainExists(subdomain, domain);

        if (isAvailable) {
            showAvailabilityResult(fullDomain, true);
            updateAvailableCount();
        } else {
            showAvailabilityResult(fullDomain, false, getDomainInfo(subdomain, domain));
        }
    }, 1500);
}

// WHOIS查询
function performWhoisQuery(fullDomain) {
    setTimeout(() => {
        const domainInfo = getDomainInfo(fullDomain.split('.')[0], fullDomain.split('.').slice(1).join('.'));
        showWhoisResult(fullDomain, domainInfo);
    }, 2000);
}

// DNS查询
function performDnsQuery(fullDomain) {
    setTimeout(() => {
        const dnsRecords = getDnsRecords(fullDomain.split('.')[0], fullDomain.split('.').slice(1).join('.'));
        showDnsResult(fullDomain, dnsRecords);
    }, 1800);
}

// 显示可用性结果
function showAvailabilityResult(domain, isAvailable, domainInfo = null) {
    const queryResults = document.getElementById('queryResults');

    if (isAvailable) {
        queryResults.innerHTML = `
            <div class="result-success">
                <div class="result-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>域名可用！</h3>
                <div class="domain-name">${domain}</div>
                <p>恭喜！这个域名可以申请。</p>
                <div class="result-actions">
                    <a href="generator-simple.html?domain=${encodeURIComponent(domain)}" class="btn btn-primary">
                        <i class="fas fa-magic"></i>
                        <span>立即申请</span>
                    </a>
                    <button onclick="copyToClipboard('${domain}')" class="btn btn-outline">
                        <i class="fas fa-copy"></i>
                        <span>复制域名</span>
                    </button>
                </div>
            </div>
        `;
    } else {
        queryResults.innerHTML = `
            <div class="result-unavailable">
                <div class="result-icon">
                    <i class="fas fa-times-circle"></i>
                </div>
                <h3>域名已被占用</h3>
                <div class="domain-name">${domain}</div>
                <p>这个域名已经被其他用户注册。</p>
                ${domainInfo ? generateDomainInfoHtml(domainInfo) : ''}
                <div class="result-actions">
                    <button onclick="suggestAlternatives('${domain}')" class="btn btn-outline">
                        <i class="fas fa-lightbulb"></i>
                        <span>建议替代方案</span>
                    </button>
                </div>
            </div>
        `;
    }
}

// 显示WHOIS结果
function showWhoisResult(domain, domainInfo) {
    const queryResults = document.getElementById('queryResults');

    if (domainInfo) {
        queryResults.innerHTML = `
            <div class="result-whois">
                <div class="result-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <h3>WHOIS 信息</h3>
                <div class="domain-name">${domain}</div>
                <div class="whois-details">
                    ${generateDomainInfoHtml(domainInfo)}
                </div>
                <div class="result-actions">
                    <button onclick="copyWhoisInfo('${domain}', ${JSON.stringify(domainInfo).replace(/"/g, '&quot;')})" class="btn btn-outline">
                        <i class="fas fa-copy"></i>
                        <span>复制信息</span>
                    </button>
                </div>
            </div>
        `;
    } else {
        queryResults.innerHTML = `
            <div class="result-not-found">
                <div class="result-icon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <h3>未找到信息</h3>
                <div class="domain-name">${domain}</div>
                <p>无法获取该域名的WHOIS信息。</p>
            </div>
        `;
    }
}

// 显示DNS结果
function showDnsResult(domain, dnsRecords) {
    const queryResults = document.getElementById('queryResults');

    if (dnsRecords && dnsRecords.length > 0) {
        const recordsHtml = dnsRecords.map(record => `
            <div class="dns-record">
                <div class="record-type ${record.type.toLowerCase()}">${record.type}</div>
                <div class="record-details">
                    <div class="record-name">${record.name}</div>
                    <div class="record-content">${record.content}</div>
                    <div class="record-meta">
                        TTL: ${record.ttl}s
                        ${record.proxied ? '<span class="proxied">• 已代理</span>' : ''}
                    </div>
                </div>
            </div>
        `).join('');

        queryResults.innerHTML = `
            <div class="result-dns">
                <div class="result-icon">
                    <i class="fas fa-server"></i>
                </div>
                <h3>DNS 记录</h3>
                <div class="domain-name">${domain}</div>
                <div class="dns-records">
                    ${recordsHtml}
                </div>
                <div class="dns-summary">
                    找到 ${dnsRecords.length} 条DNS记录
                </div>
                <div class="result-actions">
                    <button onclick="copyDnsRecords('${domain}', ${JSON.stringify(dnsRecords).replace(/"/g, '&quot;')})" class="btn btn-outline">
                        <i class="fas fa-copy"></i>
                        <span>复制记录</span>
                    </button>
                </div>
            </div>
        `;
    } else {
        queryResults.innerHTML = `
            <div class="result-not-found">
                <div class="result-icon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <h3>未找到DNS记录</h3>
                <div class="domain-name">${domain}</div>
                <p>该域名没有配置DNS记录或无法访问。</p>
            </div>
        `;
    }
}

// 生成域名信息HTML
function generateDomainInfoHtml(domainInfo) {
    return `
        <div class="domain-details">
            <div class="detail-section">
                <h4>注册信息</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">注册者</span>
                        <span class="info-value">${domainInfo.owner || '未知'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">注册时间</span>
                        <span class="info-value">${domainInfo.created || '未知'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">状态</span>
                        <span class="info-value status-active">${domainInfo.status || '活跃'}</span>
                    </div>
                    ${domainInfo.github ? `
                    <div class="info-item">
                        <span class="info-label">GitHub</span>
                        <span class="info-value">
                            <a href="https://github.com/${domainInfo.github}" target="_blank">${domainInfo.github}</a>
                        </span>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// 检查域名是否存在
function checkIfDomainExists(subdomain, domain) {
    // 这里应该调用实际的API来检查域名
    // 目前使用模拟数据
    const existingDomains = [
        'www', 'mail', 'api', 'blog', 'docs', 'admin', 'test', 'dev'
    ];

    return existingDomains.includes(subdomain.toLowerCase());
}

// 获取域名信息
function getDomainInfo(subdomain, domain) {
    // 模拟域名信息
    if (checkIfDomainExists(subdomain, domain)) {
        return {
            owner: 'LibreDomains用户',
            created: '2024-01-15',
            status: '活跃',
            github: 'example-user',
            description: '这是一个示例域名配置'
        };
    }
    return null;
}

// 获取DNS记录
function getDnsRecords(subdomain, domain) {
    // 模拟DNS记录
    if (checkIfDomainExists(subdomain, domain)) {
        return [
            {
                type: 'A',
                name: `${subdomain}.${domain}`,
                content: '192.168.1.1',
                ttl: 3600,
                proxied: true
            },
            {
                type: 'CNAME',
                name: `www.${subdomain}.${domain}`,
                content: `${subdomain}.${domain}`,
                ttl: 3600,
                proxied: false
            },
            {
                type: 'TXT',
                name: `${subdomain}.${domain}`,
                content: 'v=spf1 include:_spf.google.com ~all',
                ttl: 3600,
                proxied: false
            }
        ];
    }
    return [];
}

// 初始化建议功能
function initSuggestions() {
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');

    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const suggestion = this.getAttribute('data-suggestion');
            const subdomainInput = document.getElementById('subdomainInput');

            if (subdomainInput && suggestion) {
                subdomainInput.value = suggestion;
                subdomainInput.focus();

                // 触发验证
                validateSubdomainInput(subdomainInput, suggestion);
            }
        });
    });
}

// 初始化历史记录
function initHistory() {
    displayHistory();

    // 清除历史记录按钮
    const clearHistoryBtn = document.getElementById('clearHistory');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            if (confirm('确定要清除所有查询历史吗？')) {
                queryHistory = [];
                localStorage.setItem('queryHistory', JSON.stringify(queryHistory));
                displayHistory();
                LibreDomains.showNotification('查询历史已清除', 'success');
            }
        });
    }
}

// 显示历史记录
function displayHistory() {
    const historyContainer = document.getElementById('historyContainer');
    if (!historyContainer) return;

    if (queryHistory.length === 0) {
        historyContainer.innerHTML = `
            <div class="history-placeholder">
                <i class="fas fa-history"></i>
                <h3>暂无查询历史</h3>
                <p>开始查询域名后，历史记录将显示在这里</p>
            </div>
        `;
        return;
    }

    const historyHtml = queryHistory.slice(-10).reverse().map(item => `
        <div class="history-item" onclick="repeatQuery('${item.domain}', '${item.type}')">
            <div class="history-info">
                <div class="history-type ${item.type}">${getTypeLabel(item.type)}</div>
                <div class="history-domain">${item.domain}</div>
                <div class="history-time">${formatTime(item.timestamp)}</div>
            </div>
            <div class="history-result ${item.result}">
                <i class="fas fa-${getResultIcon(item.result)}"></i>
                <span>${getResultLabel(item.result)}</span>
            </div>
        </div>
    `).join('');

    historyContainer.innerHTML = historyHtml;
}

// 添加到历史记录
function addToHistory(domain, type, result = 'unknown') {
    const historyItem = {
        domain: domain,
        type: type,
        result: result,
        timestamp: Date.now()
    };

    queryHistory.push(historyItem);

    // 限制历史记录数量
    if (queryHistory.length > 50) {
        queryHistory = queryHistory.slice(-50);
    }

    localStorage.setItem('queryHistory', JSON.stringify(queryHistory));
    displayHistory();
}

// 重复查询
function repeatQuery(domain, type) {
    const parts = domain.split('.');
    const subdomain = parts[0];
    const domainPart = parts.slice(1).join('.');

    // 设置输入值
    const subdomainInput = document.getElementById('subdomainInput');
    const domainSelect = document.getElementById('domainSelect');

    if (subdomainInput) subdomainInput.value = subdomain;
    if (domainSelect) domainSelect.value = domainPart;

    // 切换到对应标签页
    const tabBtn = document.querySelector(`[data-tab="${type}"]`);
    if (tabBtn) {
        tabBtn.click();
    }

    // 执行查询
    setTimeout(() => {
        const queryBtn = document.getElementById('queryBtn');
        if (queryBtn) queryBtn.click();
    }, 100);
}

// 辅助函数
function getTypeLabel(type) {
    const labels = {
        availability: '可用性',
        whois: 'WHOIS',
        dns: 'DNS'
    };
    return labels[type] || type;
}

function getResultIcon(result) {
    const icons = {
        available: 'check-circle',
        unavailable: 'times-circle',
        found: 'info-circle',
        unknown: 'question-circle'
    };
    return icons[result] || 'question-circle';
}

function getResultLabel(result) {
    const labels = {
        available: '可用',
        unavailable: '已占用',
        found: '已找到',
        unknown: '未知'
    };
    return labels[result] || '未知';
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // 1分钟内
        return '刚刚';
    } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) { // 1天内
        return `${Math.floor(diff / 3600000)}小时前`;
    } else {
        return date.toLocaleDateString();
    }
}

// 更新统计数据
function updateStats() {
    // 更新查询统计
    const totalQueriesElement = document.getElementById('totalQueries');
    const availableDomainsElement = document.getElementById('availableDomains');

    if (totalQueriesElement) {
        const totalQueries = queryHistory.length;
        totalQueriesElement.textContent = totalQueries;
    }

    if (availableDomainsElement) {
        const availableCount = queryHistory.filter(item => item.result === 'available').length;
        availableDomainsElement.textContent = availableCount;
    }
}

function updateQueryCount() {
    updateStats();
}

function updateAvailableCount() {
    updateStats();
}

// 复制功能
function copyToClipboard(text) {
    LibreDomains.copyToClipboard(text).then(() => {
        LibreDomains.showNotification('已复制到剪贴板', 'success');
    }).catch(() => {
        LibreDomains.showNotification('复制失败', 'error');
    });
}

function copyWhoisInfo(domain, domainInfo) {
    const text = `域名: ${domain}\n注册者: ${domainInfo.owner}\n注册时间: ${domainInfo.created}\n状态: ${domainInfo.status}`;
    copyToClipboard(text);
}

function copyDnsRecords(domain, records) {
    const text = `${domain} DNS记录:\n` + records.map(record =>
        `${record.type} ${record.name} ${record.content} (TTL: ${record.ttl})`
    ).join('\n');
    copyToClipboard(text);
}

// 建议替代方案
function suggestAlternatives(domain) {
    const parts = domain.split('.');
    const subdomain = parts[0];
    const domainPart = parts.slice(1).join('.');

    const suggestions = [
        `${subdomain}1`,
        `${subdomain}2`,
        `my${subdomain}`,
        `${subdomain}app`,
        `${subdomain}site`,
        `${subdomain}web`
    ];

    const suggestionHtml = suggestions.map(suggestion =>
        `<button class="suggestion-btn" onclick="tryAlternative('${suggestion}.${domainPart}')">
            <i class="fas fa-arrow-right"></i>
            <span>${suggestion}.${domainPart}</span>
        </button>`
    ).join('');

    const queryResults = document.getElementById('queryResults');
    queryResults.innerHTML += `
        <div class="alternative-suggestions" style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-light);">
            <h4>建议的替代方案：</h4>
            <div class="suggestions-grid">
                ${suggestionHtml}
            </div>
        </div>
    `;
}

function tryAlternative(domain) {
    const parts = domain.split('.');
    const subdomain = parts[0];
    const domainPart = parts.slice(1).join('.');

    const subdomainInput = document.getElementById('subdomainInput');
    const domainSelect = document.getElementById('domainSelect');

    if (subdomainInput) subdomainInput.value = subdomain;
    if (domainSelect) domainSelect.value = domainPart;

    // 执行查询
    setTimeout(() => {
        const queryBtn = document.getElementById('queryBtn');
        if (queryBtn) queryBtn.click();
    }, 100);
}