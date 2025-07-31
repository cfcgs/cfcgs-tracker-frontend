// src/highcharts-theme.js

// Tema Escuro com nova paleta de cores
export const darkTheme = {
    // Nova paleta de cores elegante para o tema escuro
    colors: ['#58A6FF', '#3FB950', '#F778BA', '#A371F7', '#E3B341', '#2188FF', '#DA3633'],
    
    chart: { 
        backgroundColor: 'transparent', 
        style: { fontFamily: 'sans-serif' } 
    },
    title: { 
        style: { color: '#C9D1D9', fontSize: '18px', fontWeight: 'bold' } 
    },
    subtitle: { 
        style: { color: '#8B949E' } 
    },
    xAxis: { 
        gridLineColor: '#30363D', 
        labels: { style: { color: '#8B949E' } }, 
        lineColor: '#30363D', 
        tickColor: '#30363D', 
        title: { style: { color: '#8B949E' } } 
    },
    yAxis: { 
        gridLineColor: '#30363D', 
        labels: { style: { color: '#8B949E' } }, 
        lineColor: '#30363D', 
        tickColor: '#30363D', 
        title: { style: { color: '#8B949E' } } 
    },
    legend: { 
        itemStyle: { color: '#C9D1D9' }, 
        itemHoverStyle: { color: '#FFFFFF' }, 
        itemHiddenStyle: { color: '#484f58' } 
    },
    tooltip: { 
        backgroundColor: 'rgba(13, 17, 23, 0.85)', 
        style: { color: '#C9D1D9' } 
    },
    plotOptions: { 
        series: { 
            dataLabels: { color: '#C9D1D9' } 
        } 
    },
    credits: { enabled: false }
};

// Tema Claro (pode ser customizado depois, se necessário)
export const lightTheme = {
    credits: { enabled: false },
    title: { style: { fontSize: '18px' } },
};