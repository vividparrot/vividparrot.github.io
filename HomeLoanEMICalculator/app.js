// ===== DOM Elements =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
    loanAmount: $('#loanAmount'),
    loanAmountSlider: $('#loanAmountSlider'),
    loanAmountWords: $('#loanAmountWords'),
    interestRate: $('#interestRate'),
    interestRateSlider: $('#interestRateSlider'),
    loanTenure: $('#loanTenure'),
    loanTenureSlider: $('#loanTenureSlider'),
    tenureYears: $('#tenureYears'),
    tenureMonths: $('#tenureMonths'),
    extraMonthlyPayment: $('#extraMonthlyPayment'),
    yearlyLumpsum: $('#yearlyLumpsum'),
    yearlyLumpsumMonth: $('#yearlyLumpsumMonth'),
    lumpsumList: $('#lumpsumList'),
    addLumpsumBtn: $('#addLumpsumBtn'),
    calculateBtn: $('#calculateBtn'),
    resultsSection: $('#resultsSection'),
    monthlyEmi: $('#monthlyEmi'),
    totalInterest: $('#totalInterest'),
    totalPayment: $('#totalPayment'),
    tenureDisplay: $('#tenureDisplay'),
    savingsSection: $('#savingsSection'),
    interestSaved: $('#interestSaved'),
    tenureReduced: $('#tenureReduced'),
    originalInterest: $('#originalInterest'),
    originalTenure: $('#originalTenure'),
    chartsSection: $('#chartsSection'),
    pieChart: $('#pieChart'),
    barChart: $('#barChart'),
    amortizationSection: $('#amortizationSection'),
    amortizationTable: $('#amortizationTable'),
    expandAllBtn: $('#expandAllBtn'),
    collapseAllBtn: $('#collapseAllBtn'),
    printBtn: $('#printBtn'),
};

// ===== State =====
let tenureInYears = true;
let pieChartInstance = null;
let barChartInstance = null;
let lumpsumCounter = 0;

// ===== Indian Number Formatting =====
function formatINR(amount) {
    const num = Math.round(amount);
    const isNegative = num < 0;
    const absStr = Math.abs(num).toString();

    if (absStr.length <= 3) {
        return (isNegative ? '-' : '') + '₹' + absStr;
    }

    let lastThree = absStr.substring(absStr.length - 3);
    let rest = absStr.substring(0, absStr.length - 3);
    if (rest.length > 0) {
        lastThree = ',' + lastThree;
    }
    const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    return (isNegative ? '-' : '') + '₹' + formatted;
}

function numberToWords(num) {
    num = Math.round(num);
    if (num === 0) return '';

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);

    const parts = [];
    if (crore > 0) parts.push(crore + (crore === 1 ? ' Crore' : ' Crores'));
    if (lakh > 0) parts.push(lakh + (lakh === 1 ? ' Lakh' : ' Lakhs'));
    if (thousand > 0) parts.push(thousand + (thousand === 1 ? ' Thousand' : ' Thousand'));

    return parts.join(' ') || '';
}

// ===== Slider ↔ Input Sync =====
function syncSliderInput(slider, input, callback) {
    slider.addEventListener('input', () => {
        input.value = slider.value;
        if (callback) callback();
    });
    input.addEventListener('input', () => {
        const val = parseFloat(input.value);
        if (!isNaN(val)) {
            slider.value = Math.min(Math.max(val, parseFloat(slider.min)), parseFloat(slider.max));
        }
        if (callback) callback();
    });
}

function updateAmountWords() {
    const val = parseFloat(els.loanAmount.value);
    els.loanAmountWords.textContent = !isNaN(val) && val > 0 ? numberToWords(val) : '';
}

syncSliderInput(els.loanAmountSlider, els.loanAmount, updateAmountWords);
syncSliderInput(els.interestRateSlider, els.interestRate);
syncSliderInput(els.loanTenureSlider, els.loanTenure);
updateAmountWords();

// ===== Tenure Toggle =====
els.tenureYears.addEventListener('click', () => {
    if (tenureInYears) return;
    tenureInYears = true;
    els.tenureYears.classList.add('active');
    els.tenureMonths.classList.remove('active');
    // Convert months to years
    const months = parseInt(els.loanTenure.value) || 12;
    const years = Math.max(1, Math.round(months / 12));
    els.loanTenure.value = years;
    els.loanTenure.min = 1;
    els.loanTenure.max = 30;
    els.loanTenureSlider.min = 1;
    els.loanTenureSlider.max = 30;
    els.loanTenureSlider.value = years;
});

els.tenureMonths.addEventListener('click', () => {
    if (!tenureInYears) return;
    tenureInYears = false;
    els.tenureMonths.classList.add('active');
    els.tenureYears.classList.remove('active');
    // Convert years to months
    const years = parseInt(els.loanTenure.value) || 20;
    const months = years * 12;
    els.loanTenure.value = months;
    els.loanTenure.min = 1;
    els.loanTenure.max = 360;
    els.loanTenureSlider.min = 1;
    els.loanTenureSlider.max = 360;
    els.loanTenureSlider.value = months;
});

// ===== Lump-Sum Management =====
els.addLumpsumBtn.addEventListener('click', () => {
    lumpsumCounter++;
    const id = lumpsumCounter;
    const row = document.createElement('div');
    row.className = 'lumpsum-row';
    row.dataset.id = id;
    row.innerHTML = `
        <div class="input-group">
            <label>Amount (₹)</label>
            <input type="number" class="lumpsum-amount" min="0" step="10000" placeholder="e.g. 500000">
        </div>
        <div class="input-group">
            <label>In Month #</label>
            <input type="number" class="lumpsum-month" min="1" step="1" placeholder="e.g. 12">
        </div>
        <button class="btn-remove" title="Remove">&times;</button>
    `;
    row.querySelector('.btn-remove').addEventListener('click', () => row.remove());
    els.lumpsumList.appendChild(row);
});

function getLumpsumPayments() {
    const payments = {};
    $$('.lumpsum-row').forEach(row => {
        const amount = parseFloat(row.querySelector('.lumpsum-amount').value) || 0;
        const month = parseInt(row.querySelector('.lumpsum-month').value) || 0;
        if (amount > 0 && month > 0) {
            payments[month] = (payments[month] || 0) + amount;
        }
    });
    return payments;
}

// ===== Core EMI Calculation =====
function calculateEMI(principal, annualRate, totalMonths) {
    if (principal <= 0 || annualRate <= 0 || totalMonths <= 0) return 0;
    const r = annualRate / 12 / 100;
    const n = totalMonths;
    const emi = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    return emi;
}

// ===== Amortization Schedule Generator =====
function generateAmortization(principal, annualRate, totalMonths, extraMonthly, lumpsumPayments, yearlyLumpsum, yearlyMonth) {
    yearlyLumpsum = yearlyLumpsum || 0;
    yearlyMonth = yearlyMonth || 0;
    const r = annualRate / 12 / 100;
    const emi = calculateEMI(principal, annualRate, totalMonths);
    const schedule = [];
    let balance = principal;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;

    for (let month = 1; month <= totalMonths && balance > 0.5; month++) {
        const interestComponent = balance * r;
        let principalComponent = emi - interestComponent;
        let prepayment = 0;

        // Extra monthly payment
        if (extraMonthly > 0) {
            prepayment += extraMonthly;
        }

        // Recurring yearly lump-sum
        if (yearlyLumpsum > 0 && ((month % 12) || 12) === yearlyMonth) {
            prepayment += yearlyLumpsum;
        }

        // One-time lump-sum for this month
        if (lumpsumPayments[month]) {
            prepayment += lumpsumPayments[month];
        }

        // Ensure we don't overpay
        const totalPaymentThisMonth = principalComponent + prepayment;
        if (totalPaymentThisMonth > balance) {
            principalComponent = balance - prepayment;
            if (principalComponent < 0) {
                prepayment = balance;
                principalComponent = 0;
            }
        }

        const closingBalance = Math.max(0, balance - principalComponent - prepayment);

        totalInterestPaid += interestComponent;
        totalPrincipalPaid += principalComponent + prepayment;

        schedule.push({
            month,
            openingBalance: balance,
            emi: principalComponent + interestComponent <= balance + interestComponent ? emi : balance + interestComponent,
            principal: principalComponent,
            interest: interestComponent,
            prepayment,
            closingBalance,
            totalInterestPaid,
            totalPrincipalPaid,
        });

        balance = closingBalance;
    }

    return { schedule, emi, totalInterestPaid, totalPrincipalPaid };
}

// ===== Format Tenure =====
function formatTenure(months) {
    const y = Math.floor(months / 12);
    const m = months % 12;
    const parts = [];
    if (y > 0) parts.push(y + (y === 1 ? ' Year' : ' Years'));
    if (m > 0) parts.push(m + (m === 1 ? ' Month' : ' Months'));
    return parts.join(' ') || '0 Months';
}

// ===== Main Calculate Handler =====
els.calculateBtn.addEventListener('click', calculate);

function calculate() {
    // Parse inputs
    const principal = parseFloat(els.loanAmount.value);
    const annualRate = parseFloat(els.interestRate.value);
    let totalMonths = parseInt(els.loanTenure.value);

    // Validation
    if (isNaN(principal) || principal <= 0) {
        alert('Please enter a valid loan amount.');
        els.loanAmount.focus();
        return;
    }
    if (isNaN(annualRate) || annualRate <= 0) {
        alert('Please enter a valid interest rate.');
        els.interestRate.focus();
        return;
    }
    if (isNaN(totalMonths) || totalMonths <= 0) {
        alert('Please enter a valid loan tenure.');
        els.loanTenure.focus();
        return;
    }

    if (tenureInYears) {
        totalMonths = totalMonths * 12;
    }

    const extraMonthly = parseFloat(els.extraMonthlyPayment.value) || 0;
    const yearlyLumpsum = parseFloat(els.yearlyLumpsum.value) || 0;
    const yearlyMonth = parseInt(els.yearlyLumpsumMonth.value) || 0;
    const lumpsumPayments = getLumpsumPayments();

    const hasPrepayments = extraMonthly > 0 || yearlyLumpsum > 0 || Object.keys(lumpsumPayments).length > 0;

    // Calculate without prepayments (baseline)
    const baseline = generateAmortization(principal, annualRate, totalMonths, 0, {}, 0, 0);

    // Calculate with prepayments (if any)
    const result = hasPrepayments
        ? generateAmortization(principal, annualRate, totalMonths, extraMonthly, lumpsumPayments, yearlyLumpsum, yearlyMonth)
        : baseline;

    // Display results
    displayResults(result, baseline, hasPrepayments, totalMonths);
    displayCharts(result);
    displayAmortization(result.schedule);

    // Show sections
    els.resultsSection.style.display = '';
    els.chartsSection.style.display = '';
    els.amortizationSection.style.display = '';

    // Scroll to results
    els.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Display Results =====
function displayResults(result, baseline, hasPrepayments, originalMonths) {
    const actualMonths = result.schedule.length;

    els.monthlyEmi.textContent = formatINR(result.emi);
    els.totalInterest.textContent = formatINR(result.totalInterestPaid);
    els.totalPayment.textContent = formatINR(result.totalPrincipalPaid + result.totalInterestPaid);
    els.tenureDisplay.textContent = formatTenure(actualMonths);

    if (hasPrepayments) {
        els.savingsSection.style.display = '';
        const interestSaved = baseline.totalInterestPaid - result.totalInterestPaid;
        const monthsSaved = baseline.schedule.length - actualMonths;

        els.interestSaved.textContent = formatINR(interestSaved);
        els.tenureReduced.textContent = formatTenure(monthsSaved);
        els.originalInterest.textContent = formatINR(baseline.totalInterestPaid);
        els.originalTenure.textContent = formatTenure(baseline.schedule.length);
    } else {
        els.savingsSection.style.display = 'none';
    }
}

// ===== Charts =====
function displayCharts(result) {
    const principal = result.totalPrincipalPaid;
    const interest = result.totalInterestPaid;

    // Pie Chart
    if (pieChartInstance) pieChartInstance.destroy();
    pieChartInstance = new Chart(els.pieChart, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Interest'],
            datasets: [{
                data: [Math.round(principal), Math.round(interest)],
                backgroundColor: ['#1a73e8', '#fbbc04'],
                borderWidth: 2,
                borderColor: '#fff',
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 13 }, padding: 16 },
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((context.parsed / total) * 100).toFixed(1);
                            return ` ${context.label}: ${formatINR(context.parsed)} (${pct}%)`;
                        },
                    },
                },
            },
        },
    });

    // Bar Chart — Year-wise breakdown
    const yearData = {};
    result.schedule.forEach(row => {
        const year = Math.ceil(row.month / 12);
        if (!yearData[year]) yearData[year] = { principal: 0, interest: 0, prepayment: 0 };
        yearData[year].principal += row.principal;
        yearData[year].interest += row.interest;
        yearData[year].prepayment += row.prepayment;
    });

    const years = Object.keys(yearData).map(Number);
    const principalData = years.map(y => Math.round(yearData[y].principal));
    const interestData = years.map(y => Math.round(yearData[y].interest));
    const prepaymentData = years.map(y => Math.round(yearData[y].prepayment));

    const datasets = [
        {
            label: 'Principal',
            data: principalData,
            backgroundColor: '#1a73e8',
            borderRadius: 4,
        },
        {
            label: 'Interest',
            data: interestData,
            backgroundColor: '#fbbc04',
            borderRadius: 4,
        },
    ];

    if (prepaymentData.some(v => v > 0)) {
        datasets.push({
            label: 'Prepayment',
            data: prepaymentData,
            backgroundColor: '#0d904f',
            borderRadius: 4,
        });
    }

    if (barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(els.barChart, {
        type: 'bar',
        data: {
            labels: years.map(y => 'Year ' + y),
            datasets,
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: {
                    stacked: true,
                    ticks: {
                        callback: function (value) {
                            if (value >= 10000000) return '₹' + (value / 10000000).toFixed(1) + 'Cr';
                            if (value >= 100000) return '₹' + (value / 100000).toFixed(1) + 'L';
                            if (value >= 1000) return '₹' + (value / 1000).toFixed(0) + 'K';
                            return '₹' + value;
                        },
                    },
                },
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 13 }, padding: 16 },
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ` ${context.dataset.label}: ${formatINR(context.parsed.y)}`;
                        },
                    },
                },
            },
        },
    });
}

// ===== Amortization Table =====
function displayAmortization(schedule) {
    // Group by year
    const years = {};
    schedule.forEach(row => {
        const year = Math.ceil(row.month / 12);
        if (!years[year]) years[year] = [];
        years[year].push(row);
    });

    let html = `
        <table class="amort-table">
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Opening Balance</th>
                    <th>EMI</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Prepayment</th>
                    <th>Closing Balance</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.entries(years).forEach(([year, rows]) => {
        const yearPrincipal = rows.reduce((s, r) => s + r.principal, 0);
        const yearInterest = rows.reduce((s, r) => s + r.interest, 0);
        const yearPrepayment = rows.reduce((s, r) => s + r.prepayment, 0);
        const yearEmi = rows.reduce((s, r) => s + (r.principal + r.interest), 0);
        const openBal = rows[0].openingBalance;
        const closeBal = rows[rows.length - 1].closingBalance;

        html += `
            <tr class="year-header" data-year="${year}">
                <td colspan="1"><span class="toggle-icon">▼</span> Year ${year}</td>
                <td>${formatINR(openBal)}</td>
                <td>${formatINR(yearEmi)}</td>
                <td>${formatINR(yearPrincipal)}</td>
                <td>${formatINR(yearInterest)}</td>
                <td>${yearPrepayment > 0 ? formatINR(yearPrepayment) : '-'}</td>
                <td>${formatINR(closeBal)}</td>
            </tr>
        `;

        rows.forEach(row => {
            const hasPrepay = row.prepayment > 0;
            html += `
                <tr class="month-row ${hasPrepay ? 'prepayment-row' : ''}" data-year="${year}">
                    <td>${row.month}</td>
                    <td>${formatINR(row.openingBalance)}</td>
                    <td>${formatINR(row.principal + row.interest)}</td>
                    <td>${formatINR(row.principal)}</td>
                    <td>${formatINR(row.interest)}</td>
                    <td>${hasPrepay ? formatINR(row.prepayment) : '-'}</td>
                    <td>${formatINR(row.closingBalance)}</td>
                </tr>
            `;
        });
    });

    html += '</tbody></table>';
    els.amortizationTable.innerHTML = html;

    // Year header click to toggle
    $$('.year-header').forEach(header => {
        header.addEventListener('click', () => {
            const year = header.dataset.year;
            header.classList.toggle('collapsed');
            $$(`.month-row[data-year="${year}"]`).forEach(row => {
                row.classList.toggle('hidden');
            });
        });
    });
}

// ===== Expand / Collapse All =====
els.expandAllBtn.addEventListener('click', () => {
    $$('.year-header').forEach(h => h.classList.remove('collapsed'));
    $$('.month-row').forEach(r => r.classList.remove('hidden'));
});

els.collapseAllBtn.addEventListener('click', () => {
    $$('.year-header').forEach(h => h.classList.add('collapsed'));
    $$('.month-row').forEach(r => r.classList.add('hidden'));
});

// ===== Print =====
els.printBtn.addEventListener('click', () => window.print());
