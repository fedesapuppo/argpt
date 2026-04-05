const I18n = {
  _lang: 'es',

  translations: {
    es: {
      // Nav & header
      'nav.open_dashboard': 'Abrir Dashboard',
      'nav.subtitle': 'Gestor de Portafolio Argentino',
      'lang.toggle': 'ENGLISH',

      // Hero
      'hero.title_1': 'Monitoreá tu portafolio',
      'hero.title_2': 'argentino, pero en ',
      'hero.title_em': 'dólares',
      'hero.subtitle': 'Importá tus tenencias desde Balanz o Interactive Brokers. Vé tus retornos reales después de la conversión MEP, el arrastre cambiario y toda la complejidad del mercado argentino.',
      'hero.btn_dashboard': 'Abrir Dashboard',
      'hero.btn_how': 'Cómo funciona',

      // Features
      'features.title': 'Hecho para inversores argentinos',
      'features.lead': 'No es otro tracker genérico. ARGPT entiende CEDEARs, tipos de cambio MEP y el verdadero costo de tener activos argentinos.',
      'features.portfolio.title': 'Vista del portafolio',
      'features.portfolio.desc': 'Vé todas tus tenencias en una sola vista. Costo en ARS, valor de mercado en USD, distribución de peso y P&L que tiene en cuenta el arrastre cambiario.',
      'features.technicals.title': 'Señales técnicas',
      'features.technicals.desc': 'RSI, Estocástico, Supertrend y medias móviles para cada tenencia. Puntajes de salud con colores que muestran de un vistazo qué posiciones son fuertes.',
      'features.fundamentals.title': 'Análisis fundamental',
      'features.fundamentals.desc': 'P/E, ROE, márgenes y ratios de deuda comparados contra medianas del sector. Sabé si tu acción está barata o cara respecto a sus pares.',

      // Currency section
      'currency.title_1': 'El problema del MEP,',
      'currency.title_2': 'resuelto',
      'currency.desc1': 'Todo inversor argentino conoce el dolor: tu CEDEAR subió 20% en pesos, pero el tipo de cambio MEP también se movió. Realmente ganaste plata en dólares?',
      'currency.desc2_1': 'ARGPT descompone tu retorno en ',
      'currency.desc2_price': 'cambio de precio',
      'currency.desc2_and': ' y ',
      'currency.desc2_fx': 'efecto cambiario',
      'currency.desc2_2': ', mostrando el resultado real en USD. Importá tu MEP de entrada o fecha de compra y lo buscamos por vos.',
      'currency.header': 'Descomposición del retorno',
      'currency.price_label': 'Retorno de precio (ARS)',
      'currency.price_sub': 'Rendimiento del activo en pesos',
      'currency.fx_label': 'Efecto cambiario',
      'currency.fx_sub': 'Cambio del MEP desde la compra',
      'currency.usd_label': 'Retorno USD',

      // Workflow
      'workflow.title': 'Tres pasos hacia la claridad',
      'workflow.lead': 'Sin registro. Sin servidor. Tus datos se quedan en tu navegador.',
      'workflow.step1.title': 'Importá tenencias',
      'workflow.step1.desc': 'Subí un export XLSX de Balanz o CSV de Interactive Brokers. O agregá posiciones manualmente con ticker, cantidad y precio de costo.',
      'workflow.step2.title': 'Precios en vivo',
      'workflow.step2.desc': 'ARGPT obtiene precios en tiempo real, tipos MEP/CCL, indicadores técnicos y fundamentales de Data912 y finance-query.com.',
      'workflow.step3.title': 'Vé retornos reales',
      'workflow.step3.desc': 'Mirá tu portafolio en USD. Entendé la descomposición precio vs. moneda. Detectá posiciones débiles y fuertes al instante.',

      // Asset types
      'assets.title': 'Tipos de activos cubiertos',
      'assets.cedear.title': 'Certificados de Depósito Argentinos',
      'assets.cedear.desc': 'Wrappers locales de acciones americanas, cotizados en ARS en BYMA. ARGPT convierte via MEP y maneja la matemática del ratio para que veas el valor real en USD.',
      'assets.arg.title': 'Acciones argentinas',
      'assets.arg.desc': 'Acciones listadas en BYMA como GGAL, YPF, TXAR. Cotizadas en ARS, convertidas a USD via tipo MEP para un seguimiento real en dólares.',
      'assets.us.title': 'Acciones estadounidenses',
      'assets.us.desc': 'Acciones de NYSE y NASDAQ en brokers internacionales. Ya en USD — mostradas junto a tus posiciones argentinas para la foto completa.',

      // Footer
      'footer.text': 'ARGPT \u2014 tus datos nunca salen de tu navegador. Hecho con vanilla JS, sin frameworks, sin tracking.',

      // Dashboard - tabs
      'tab.portfolio': 'Portafolio',
      'tab.technicals': 'Técnicos',
      'tab.fundamentals': 'Fundamentales',
      'tab.glossary': 'Glosario',

      // Dashboard - warning
      'warning.fx': '\u26A0 Algunas tenencias no tienen tipo de cambio de entrada — los retornos en USD son aproximados. Editá las tenencias para agregar tu tipo MEP de compra para resultados precisos.',

      // Dashboard - summary cards
      'summary.total_value': 'Valor Total USD',
      'summary.total_pnl': 'P&L Total USD',
      'summary.arg_pnl': 'P&L Acc. Arg. USD',
      'summary.ced_pnl': 'P&L CEDEARs USD',

      // Dashboard - import buttons
      'import.balanz': 'Importar Balanz XLSX',
      'import.ib': 'Importar IB CSV',
      'import.sample': 'Cargar Datos de Ejemplo',
      'import.clear': 'Limpiar Todo',
      'import.sample_loaded': 'Portafolio de ejemplo cargado',
      'import.cleared': 'Tenencias eliminadas',
      'import.clear_confirm': 'Limpiar todas las tenencias?',
      'import.reading': 'Leyendo...',
      'import.sheet_not_found': 'Hoja "${sheet}" no encontrada. Hojas: ${sheets}',
      'import.balanz_success': 'Importadas ${count} tenencias de Balanz (por lote)',
      'import.ib_success': 'Importadas ${count} tenencias de IB',

      // Dashboard - form
      'form.add_holding': '+ Agregar Tenencia',
      'form.ticker': 'Ticker',
      'form.type': 'Tipo',
      'form.shares': 'Cantidad',
      'form.avg_price': 'Precio Promedio',
      'form.purchase_date': 'Fecha de Compra',
      'form.entry_mep': 'MEP de Entrada',
      'form.hint_default': 'Ingresá fecha o tipo. La fecha autocompleta el tipo desde los datos.',
      'form.hint_using_mep': 'Usando MEP actual (${rate}). Editá si tu tipo de compra era diferente.',
      'form.add_btn': 'Agregar',

      // Dashboard - empty state
      'empty.text': 'Sin tenencias aún. Agregá una arriba para comenzar.',

      // Dashboard - updated
      'updated': 'Actualizado ${date}',

      // Table headers & tooltips
      'th.ticker': 'Ticker',
      'th.ticker_tip': 'Símbolo del activo y tipo (CEDEAR, acción argentina, acción US)',
      'th.broker': 'Broker',
      'th.broker_tip': 'Broker donde se mantiene la posición',
      'th.shares': 'Cantidad',
      'th.shares_tip': 'Número de acciones/certificados',
      'th.avg_ars': 'Prom ARS',
      'th.avg_ars_tip': 'Precio promedio de compra en ARS por acción',
      'th.avg_usd': 'Prom USD',
      'th.avg_usd_tip': 'Precio promedio de compra en USD por acción (precio ARS \u00F7 tipo MEP de compra para activos argentinos)',
      'th.price_usd': 'Precio USD',
      'th.price_usd_tip': 'Precio actual en USD (via MEP para activos argentinos)',
      'th.price_pct': 'Precio %',
      'th.price_pct_tip': 'Cambio de precio en moneda nativa desde la compra',
      'th.currency_pct': 'Moneda %',
      'th.currency_pct_tip': 'Cambio del tipo MEP desde la compra (depreciación/apreciación del peso)',
      'th.usd_ret': 'Ret USD %',
      'th.usd_ret_tip': 'Retorno combinado de precio y moneda en USD',
      'th.value_usd': 'Valor USD',
      'th.value_usd_tip': 'Valor total de la posición en USD',
      'th.pnl_usd': 'P&L USD',
      'th.pnl_usd_tip': 'Ganancia o pérdida en dólares',
      'th.weight': 'Peso %',
      'th.weight_tip': 'Peso de la posición como % del valor total del portafolio',

      // Technicals headers
      'th.tech_price_tip': 'Precio actual en USD',
      'th.ath': '% Bajo ATH',
      'th.ath_tip': 'Qué tan lejos está del máximo histórico',
      'th.rsi': 'RSI(14)',
      'th.rsi_tip': 'Índice de Fuerza Relativa, 14 periodos',
      'th.stoch': 'Estoc K/D',
      'th.stoch_tip': 'Oscilador estocástico',
      'th.supertrend': 'Supertrend',
      'th.supertrend_tip': 'Indicador de seguimiento de tendencia',
      'th.sma20': 'vs SMA20',
      'th.sma20_tip': '% por encima o debajo de la media móvil de 20 días',
      'th.sma50': 'vs SMA50',
      'th.sma50_tip': '% por encima o debajo de la media móvil de 50 días',
      'th.health': 'Salud',
      'th.health_tip': 'Puntaje de salud combinado de todos los indicadores',

      // Fundamentals headers
      'th.pe_tip': 'Precio sobre ganancias últimos 12 meses',
      'th.fwd_pe_tip': 'Precio sobre ganancias estimadas futuras',
      'th.pb_tip': 'Precio sobre valor libro',
      'th.roe_tip': 'Retorno sobre el patrimonio',
      'th.eps_gr_tip': 'Crecimiento de ganancias por acción interanual',
      'th.div_yld_tip': 'Rendimiento de dividendo anual',
      'th.de_tip': 'Ratio deuda sobre patrimonio',
      'th.margin_tip': 'Margen de ganancia neta',
      'th.sector_tip': 'Clasificación sectorial GICS',
      'th.sector': 'Sector',

      // Table dynamic tooltips
      'tip.shares_held': 'Acciones en cartera',
      'tip.avg_ars_price': 'Precio promedio de compra en ARS por acción',
      'tip.free_shares': 'Acciones gratuitas por acción corporativa',
      'tip.us_no_ars': 'Activo US — sin precio en ARS',
      'tip.avg_usd_price': 'Precio promedio de compra en USD por acción',
      'tip.current_usd_mep': 'Precio actual en USD via MEP',
      'tip.current_usd': 'Precio actual de mercado en USD',
      'tip.price_change_ars': 'Cambio de precio en ARS desde la compra',
      'tip.price_change_usd': 'Cambio de precio en USD desde la compra',
      'tip.peso_movement': 'Movimiento del peso: MEP fue de ${from} al tipo actual',
      'tip.no_fx': 'Sin conversión FX — ya está en USD',
      'tip.total_return_usd': 'Retorno total en USD desde la compra',
      'tip.position_value': 'Valor total de la posición en USD',
      'tip.pnl_usd': 'Ganancia o pérdida en USD',
      'tip.weight': '% del valor total del portafolio en USD',
      'tip.ratio': 'Ratio: ${ratio} (CEDEARs por acción)',

      // Technicals tooltips
      'tip.at_ath': 'En o cerca del máximo histórico',
      'tip.far_ath': 'Más de 50% debajo del ATH',
      'tip.below_ath': '% debajo del máximo histórico',
      'tip.no_rsi': 'Sin datos de RSI',
      'tip.oversold': 'Sobrevendido — acción bajo presión',
      'tip.strong_momentum': 'Impulso fuerte',
      'tip.neutral_momentum': 'Impulso neutral',
      'tip.no_stoch': 'Sin datos de estocástico',
      'tip.oversold_zone': 'Zona de sobreventa',
      'tip.overbought_zone': 'Zona de sobrecompra',
      'tip.neutral_zone': 'Zona neutral',
      'tip.k_above_d': 'K sobre D — señal alcista',
      'tip.k_below_d': 'K debajo de D — señal bajista',
      'tip.from_oversold': ' (desde sobreventa)',
      'tip.from_overbought': ' (desde sobrecompra)',
      'tip.supertrend_up': 'Tendencia alcista — precio sobre línea Supertrend',
      'tip.supertrend_down': 'Tendencia bajista — precio debajo de línea Supertrend',
      'tip.supertrend_up_short': '\u25B2 Alza',
      'tip.supertrend_down_short': '\u25BC Baja',
      'tip.price_vs_sma': 'Precio vs SMA${period} (${value})',
      'tip.sma_label': 'Media de ${period} días',
      'tip.health_label': 'Salud: ${score} (${parts})',
      'tip.current_price_usd': 'Precio actual en USD',

      // Fundamentals tooltips
      'tip.no_benchmark': '${metric} \u2014 sin benchmark sectorial',
      'tip.favorable': 'Favorable',
      'tip.in_line': 'En línea',
      'tip.unfavorable': 'Desfavorable',
      'tip.vs_sector': '${label} vs mediana de ${sector}',
      'tip.vs_sector_value': '${label} vs mediana de ${sector} (${value})',
      'tip.earnings_growing': 'Ganancias en crecimiento',
      'tip.earnings_declining': 'Ganancias en descenso',
      'tip.no_data': 'Sin datos',
      'tip.dividend_pct': 'Dividendo anual como % del precio',
      'tip.no_dividend': 'Sin dividendo',
      'tip.benchmark_group': 'Grupo de comparación',

      // Type labels & tips
      'type.cedear': 'CED',
      'type.arg_stock': 'ARG',
      'type.us_stock': 'US',
      'type.cedear_tip': 'CEDEAR — Certificado de depósito argentino (cotizado en ARS, convertido via MEP)',
      'type.arg_stock_tip': 'Acción argentina listada en BYMA (cotizada en ARS, convertida via MEP)',
      'type.us_stock_tip': 'Acción US (cotizada en USD)',

      // Broker tips
      'broker.balanz_tip': 'Balanz — Broker argentino',
      'broker.ib_tip': 'Interactive Brokers — Broker US',
      'broker.unknown': 'Broker desconocido',

      // Form options & filters
      'filter.all': 'Todos',
      'option.cedear': 'CEDEAR',
      'option.arg_stock': 'Acción Arg',
      'option.us_stock': 'Acción US',

      // Glossary
      'glossary.asset_types_title': 'Tipos de Activos y Conversión de Moneda',
      'glossary.cedear_def': '<strong class="text-white">CEDEAR</strong> — Certificado de Depósito Argentino. Wrapper local de acciones americanas, cotizado en ARS en BYMA. Valor en USD derivado via tipo MEP. El ratio (ej: 1:20) muestra cuántos CEDEARs equivalen a una acción US.',
      'glossary.arg_stock_def': '<strong class="text-white">Acción Argentina</strong> — Acción listada en BYMA, cotizada en ARS. Valor en USD derivado via tipo MEP.',
      'glossary.us_stock_def': '<strong class="text-white">Acción US</strong> — Acción listada en NYSE/NASDAQ, cotizada en USD. No necesita conversión de moneda.',
      'glossary.mep_def': '<strong class="text-white">MEP (Dólar MEP)</strong> — Tipo de cambio implícito obtenido via operaciones de bonos locales (AL30/AL30D). Usado para convertir activos en ARS a USD. Fuente: Data912.',
      'glossary.ccl_def': '<strong class="text-white">CCL (Dólar CCL)</strong> — Tipo de cambio implícito via arbitraje ADR (liquida en el exterior). Usado para mostrar acciones US en ARS.',

      'glossary.portfolio_title': 'Portafolio',
      'glossary.avg_ars_def': '<strong class="text-white">Prom ARS</strong> — Precio promedio de compra en ARS por acción. Solo se muestra para activos argentinos (CEDEARs, acciones arg).',
      'glossary.avg_usd_def': '<strong class="text-white">Prom USD</strong> — Precio promedio de compra en USD por acción.<br>Activos argentinos: <code class="text-accent">precio_ars \u00F7 tipo_mep_entrada</code><br>Acciones US: el precio de compra (ya en USD).',
      'glossary.price_usd_def': '<strong class="text-white">Precio USD</strong> — Precio de mercado actual en USD.<br>Activos argentinos: <code class="text-accent">precio_ars_actual \u00F7 tipo_mep_actual</code><br>Acciones US: el precio de mercado.',
      'glossary.price_pct_def': '<strong class="text-white">Precio %</strong> — Cambio de precio desde la compra en la moneda nativa del activo.<br><code class="text-accent">(precio_actual \u2212 precio_prom) \u00F7 precio_prom \u00D7 100</code>',
      'glossary.currency_pct_def': '<strong class="text-white">Moneda %</strong> — Cambio en el tipo MEP desde la compra, reflejando depreciación o apreciación del peso. Solo aplica a activos argentinos.<br><code class="text-accent">(mep_entrada \u00F7 mep_actual \u2212 1) \u00D7 100</code>',
      'glossary.usd_ret_def': '<strong class="text-white">Ret USD %</strong> — Retorno total en USD, combinando efectos de precio y moneda. La composición evita sobreestimar o subestimar el resultado real en USD.<br><code class="text-accent">(1 + precio%) \u00D7 (1 + moneda%) \u2212 1</code>',
      'glossary.value_usd_def': '<strong class="text-white">Valor USD</strong> — Valor total de la posición en USD.<br><code class="text-accent">cantidad \u00D7 precio_usd</code>',
      'glossary.pnl_usd_def': '<strong class="text-white">P&L USD</strong> — Ganancia o pérdida en dólares.<br><code class="text-accent">(precio_usd \u2212 prom_usd) \u00D7 cantidad</code>',
      'glossary.weight_def': '<strong class="text-white">Peso %</strong> — Tamaño de la posición como porcentaje del valor total del portafolio.<br><code class="text-accent">valor_usd \u00F7 total_portafolio_usd \u00D7 100</code>',

      'glossary.technicals_title': 'Técnicos',
      'glossary.technicals_intro': 'Los colores muestran <strong class="text-white">salud del portafolio</strong>: <span class="text-gain">verde</span> = tenencia fuerte, <span class="text-loss">rojo</span> = tenencia débil. Los colores se desvanecen a blanco — solo los extremos tienen color pleno.',
      'glossary.ath_def': '<strong class="text-white">% Bajo ATH</strong> — Qué tan lejos está el precio actual de su máximo histórico.<br><span class="text-gain">Verde pleno</span> en 0% (en ATH), se desvanece a blanco en 15%, <span class="text-loss">rojo pleno</span> en 30%+.<br><code class="text-accent">(precio \u00F7 máximo_histórico \u2212 1) \u00D7 100</code>',
      'glossary.rsi_def': '<strong class="text-white">RSI(14)</strong> — Índice de Fuerza Relativa en 14 periodos. Mide el impulso comparando ganancias promedio vs pérdidas promedio.<br><span class="text-loss">Rojo pleno</span> \u2264 20 (sobreventa profunda), se desvanece a blanco en 30, blanco 30\u201370 (neutral), se desvanece a verde en 80, <span class="text-gain">verde pleno</span> \u226580 (impulso fuerte).<br><code class="text-accent">100 \u2212 100 \u00F7 (1 + gan_prom \u00F7 perd_prom)</code>',
      'glossary.stoch_def': '<strong class="text-white">Estoc K/D</strong> — Oscilador estocástico. %K = donde cerró el precio vs el rango alto-bajo (14 periodos). %D = SMA de 3 periodos de %K. Cuando K cruza por encima de D, el impulso está girando al alza (y viceversa).<br><span class="text-loss">Rojo pleno</span> en 0 (sobreventa profunda), se desvanece a blanco en 20, blanco 20\u201380 (neutral), se desvanece a verde en 80, <span class="text-gain">verde pleno</span> en 100.<br><code class="text-accent">%K = (cierre \u2212 min\u2081\u2084) \u00F7 (max\u2081\u2084 \u2212 min\u2081\u2084) \u00D7 100</code>',
      'glossary.supertrend_def': '<strong class="text-white">Supertrend</strong> — Indicador de seguimiento de tendencia basado en Average True Range (ATR).<br><span class="text-gain">Verde</span> = tendencia alcista (precio sobre banda), <span class="text-loss">rojo</span> = tendencia bajista (precio debajo de banda).<br><code class="text-accent">banda = (max + min) \u00F7 2 + multiplicador \u00D7 ATR</code>',
      'glossary.sma_def': '<strong class="text-white">vs SMA20 / vs SMA50</strong> — Qué tan lejos está el precio por encima o debajo de la media móvil simple de 20/50 días, mostrado como %.<br>Blanco dentro de \u00B11%, se desvanece a <span class="text-gain">verde pleno</span> en +10% (sobre SMA) o <span class="text-loss">rojo pleno</span> en \u221210% (debajo de SMA). El tooltip muestra el valor real de la SMA. Para CEDEARs, usa el precio de la acción US subyacente.<br><code class="text-accent">(precio \u2212 SMA) \u00F7 SMA \u00D7 100</code>',
      'glossary.health_def': '<strong class="text-white">Salud</strong> — Puntaje combinado de 5 indicadores. Cada uno aporta +1 (alcista) o \u22121 (bajista):<br>RSI \u226550 = +1, Estoc K > D = +1, Supertrend alza = +1, precio > SMA20 = +1, precio > SMA50 = +1.<br>Rango: <span class="text-gain">+5</span> (todo alcista) a <span class="text-loss">\u22125</span> (todo bajista). Pasa el mouse para ver detalle por indicador.',

      'glossary.fundamentals_title': 'Fundamentales',
      'glossary.fundamentals_intro': 'Las métricas con color se comparan con <strong class="text-white">medianas sectoriales</strong>: <span class="text-gain">verde</span> = mejor que el sector, <span style="color: #d29922">amarillo</span> = cerca del promedio sectorial, <span class="text-loss">rojo</span> = peor que el sector. Cuando no hay datos sectoriales, se usan umbrales absolutos.',
      'glossary.pe_def': '<strong class="text-white">P/E</strong> — Precio sobre ganancias de los últimos 12 meses. Menor es mejor (valuación más barata). <span class="text-gain">Verde</span> debajo de la mediana del sector, <span class="text-loss">rojo</span> por encima de 1.5\u00D7.<br><code class="text-accent">precio_acción \u00F7 ganancia_por_acción</code>',
      'glossary.fwd_pe_def': '<strong class="text-white">Fwd P/E</strong> — Precio sobre ganancias futuras estimadas. Misma interpretación que P/E pero basado en estimaciones de analistas.<br><code class="text-accent">precio_acción \u00F7 gpa_futuro_estimado</code>',
      'glossary.pb_def': '<strong class="text-white">P/B</strong> — Precio sobre valor libro por acción. Compara precio de mercado con valor contable.<br><code class="text-accent">precio_acción \u00F7 valor_libro_por_acción</code>',
      'glossary.roe_def': '<strong class="text-white">ROE %</strong> — Retorno sobre patrimonio. Mayor es mejor (uso eficiente del capital). <span class="text-gain">Verde</span> por encima de la mediana del sector, <span class="text-loss">rojo</span> debajo del 50%.<br><code class="text-accent">ganancia_neta \u00F7 patrimonio \u00D7 100</code>',
      'glossary.eps_gr_def': '<strong class="text-white">Crec GPA %</strong> — Crecimiento interanual de ganancia por acción.<br><code class="text-accent">(gpa_actual \u2212 gpa_anterior) \u00F7 |gpa_anterior| \u00D7 100</code>',
      'glossary.div_yld_def': '<strong class="text-white">Rend Div %</strong> — Rendimiento de dividendo anual como porcentaje del precio de la acción.<br><code class="text-accent">dividendos_anuales \u00F7 precio_acción \u00D7 100</code>',
      'glossary.de_def': '<strong class="text-white">D/E</strong> — Ratio deuda sobre patrimonio. Menor es mejor (menos apalancamiento). <span class="text-gain">Verde</span> debajo de la mediana del sector, <span class="text-loss">rojo</span> por encima de 2\u00D7.<br><code class="text-accent">deuda_total \u00F7 patrimonio</code>',
      'glossary.margin_def': '<strong class="text-white">Margen %</strong> — Margen de ganancia neta. Mayor es mejor. <span class="text-gain">Verde</span> por encima de la mediana del sector, <span class="text-loss">rojo</span> debajo del 50%.<br><code class="text-accent">ganancia_neta \u00F7 ingresos \u00D7 100</code>',
    },

    en: {
      'nav.open_dashboard': 'Open Dashboard',
      'nav.subtitle': 'Argentine Portfolio Tracker',
      'lang.toggle': 'ESPANOL',

      'hero.title_1': 'Track your Argentine',
      'hero.title_2': 'portfolio in ',
      'hero.title_em': 'real USD',
      'hero.subtitle': 'Import your holdings from Balanz or Interactive Brokers. See your real returns after MEP conversion, currency drag, and all the complexity the Argentine market throws at you.',
      'hero.btn_dashboard': 'Open Dashboard',
      'hero.btn_how': 'How it works',

      'features.title': 'Built for Argentine investors',
      'features.lead': 'Not another generic tracker. ARGPT understands CEDEARs, MEP rates, and the real cost of holding Argentine assets.',
      'features.portfolio.title': 'Portfolio overview',
      'features.portfolio.desc': 'See all your holdings in one view. ARS cost basis, USD market value, weight distribution, and P&L that accounts for currency drag.',
      'features.technicals.title': 'Technical signals',
      'features.technicals.desc': 'RSI, Stochastic, Supertrend, and SMA readings for every holding. Color-coded health scores tell you which positions are strong at a glance.',
      'features.fundamentals.title': 'Fundamental analysis',
      'features.fundamentals.desc': 'P/E, ROE, margins, and debt ratios benchmarked against sector medians. Know if your stock is cheap or expensive relative to its peers.',

      'currency.title_1': 'The MEP problem,',
      'currency.title_2': 'solved',
      'currency.desc1': 'Every Argentine investor knows the pain: your CEDEAR is up 20% in pesos, but the MEP rate moved too. Did you actually make money in dollars?',
      'currency.desc2_1': 'ARGPT decomposes your return into ',
      'currency.desc2_price': 'price change',
      'currency.desc2_and': ' and ',
      'currency.desc2_fx': 'currency effect',
      'currency.desc2_2': ', showing the real USD result. Import your entry MEP rate or purchase date and we\'ll look it up.',
      'currency.header': 'Return decomposition',
      'currency.price_label': 'Price return (ARS)',
      'currency.price_sub': 'Asset performance in pesos',
      'currency.fx_label': 'Currency effect',
      'currency.fx_sub': 'MEP rate change since purchase',
      'currency.usd_label': 'USD return',

      'workflow.title': 'Three steps to clarity',
      'workflow.lead': 'No sign-up. No server. Your data stays in your browser.',
      'workflow.step1.title': 'Import holdings',
      'workflow.step1.desc': 'Upload a Balanz XLSX export or Interactive Brokers CSV. Or add positions manually with ticker, shares, and cost basis.',
      'workflow.step2.title': 'Get live prices',
      'workflow.step2.desc': 'ARGPT fetches real-time prices, MEP/CCL rates, technicals, and fundamentals from Data912 and finance-query.com.',
      'workflow.step3.title': 'See real returns',
      'workflow.step3.desc': 'View your portfolio in USD. Understand the price vs. currency breakdown. Spot weak and strong positions instantly.',

      'assets.title': 'Asset types covered',
      'assets.cedear.title': 'Argentine Depositary Receipts',
      'assets.cedear.desc': 'Local wrappers for US stocks, priced in ARS on BYMA. ARGPT converts through MEP and handles the ratio math so you see the real USD value.',
      'assets.arg.title': 'Argentine equities',
      'assets.arg.desc': 'Stocks listed on BYMA like GGAL, YPF, TXAR. Priced in ARS, converted to USD via MEP rate for true dollar-denominated tracking.',
      'assets.us.title': 'US equities',
      'assets.us.desc': 'NYSE and NASDAQ stocks held through international brokers. Already in USD \u2014 shown alongside your Argentine positions for the full picture.',

      'footer.text': 'ARGPT \u2014 your data never leaves your browser. Built with vanilla JS, no frameworks, no tracking.',

      'tab.portfolio': 'Portfolio',
      'tab.technicals': 'Technicals',
      'tab.fundamentals': 'Fundamentals',
      'tab.glossary': 'Glossary',

      'warning.fx': '\u26A0 Some holdings are missing entry exchange rates \u2014 USD returns are approximate. Edit holdings to add your MEP rate at purchase for accurate results.',

      'summary.total_value': 'Total USD Value',
      'summary.total_pnl': 'Total USD P&L',
      'summary.arg_pnl': 'Arg Stocks USD P&L',
      'summary.ced_pnl': 'CEDEARs USD P&L',

      'import.balanz': 'Import Balanz XLSX',
      'import.ib': 'Import IB CSV',
      'import.sample': 'Load Sample Data',
      'import.clear': 'Clear All',
      'import.sample_loaded': 'Sample portfolio loaded',
      'import.cleared': 'Holdings cleared',
      'import.clear_confirm': 'Clear all holdings?',
      'import.reading': 'Reading...',
      'import.sheet_not_found': 'Sheet "${sheet}" not found. Sheets: ${sheets}',
      'import.balanz_success': 'Imported ${count} Balanz holdings (per-lot)',
      'import.ib_success': 'Imported ${count} IB holdings',

      'form.add_holding': '+ Add Holding',
      'form.ticker': 'Ticker',
      'form.type': 'Type',
      'form.shares': 'Shares',
      'form.avg_price': 'Avg Price',
      'form.purchase_date': 'Purchase Date',
      'form.entry_mep': 'Entry MEP Rate',
      'form.hint_default': 'Enter date or rate. Date auto-fills rate from data.',
      'form.hint_using_mep': 'Using current MEP (${rate}). Edit if your purchase rate was different.',
      'form.add_btn': 'Add',

      'empty.text': 'No holdings yet. Add one above to get started.',

      'updated': 'Updated ${date}',

      'th.ticker': 'Ticker',
      'th.ticker_tip': 'Asset symbol & asset type (CEDEAR, Argentine stock, US stock)',
      'th.broker': 'Broker',
      'th.broker_tip': 'Broker where the position is held',
      'th.shares': 'Shares',
      'th.shares_tip': 'Number of shares held',
      'th.avg_ars': 'Avg ARS',
      'th.avg_ars_tip': 'Avg purchase price in ARS per share',
      'th.avg_usd': 'Avg USD',
      'th.avg_usd_tip': 'Avg purchase price in USD per share (ARS price \u00F7 MEP rate at purchase for Argentine assets)',
      'th.price_usd': 'Price USD',
      'th.price_usd_tip': 'Current price in USD (via MEP for Argentine assets)',
      'th.price_pct': 'Price %',
      'th.price_pct_tip': 'Price change in native currency since purchase',
      'th.currency_pct': 'Currency %',
      'th.currency_pct_tip': 'MEP rate change since purchase (peso depreciation/appreciation)',
      'th.usd_ret': 'USD Ret %',
      'th.usd_ret_tip': 'Combined price and currency return in USD',
      'th.value_usd': 'Value USD',
      'th.value_usd_tip': 'Total position value in USD',
      'th.pnl_usd': 'USD P&L',
      'th.pnl_usd_tip': 'Profit or loss in US dollars',
      'th.weight': 'Weight %',
      'th.weight_tip': 'Position weight as % of total portfolio value',

      'th.tech_price_tip': 'Current price in USD',
      'th.ath': '% Below ATH',
      'th.ath_tip': 'How far below the all-time high',
      'th.rsi': 'RSI(14)',
      'th.rsi_tip': 'Relative Strength Index, 14 periods',
      'th.stoch': 'Stoch K/D',
      'th.stoch_tip': 'Stochastic oscillator',
      'th.supertrend': 'Supertrend',
      'th.supertrend_tip': 'Trend-following indicator',
      'th.sma20': 'vs SMA20',
      'th.sma20_tip': '% above or below 20-day moving average',
      'th.sma50': 'vs SMA50',
      'th.sma50_tip': '% above or below 50-day moving average',
      'th.health': 'Health',
      'th.health_tip': 'Combined health score from all indicators',

      'th.pe_tip': 'Price to trailing earnings',
      'th.fwd_pe_tip': 'Price to estimated forward earnings',
      'th.pb_tip': 'Price to book value',
      'th.roe_tip': 'Return on equity',
      'th.eps_gr_tip': 'Earnings per share growth YoY',
      'th.div_yld_tip': 'Annual dividend yield',
      'th.de_tip': 'Debt to equity ratio',
      'th.margin_tip': 'Net profit margin',
      'th.sector_tip': 'GICS sector classification',
      'th.sector': 'Sector',

      'tip.shares_held': 'Shares held',
      'tip.avg_ars_price': 'Avg purchase price in ARS per share',
      'tip.free_shares': 'Free shares from corporate action',
      'tip.us_no_ars': 'US asset \u2014 no ARS price',
      'tip.avg_usd_price': 'Avg purchase price in USD per share',
      'tip.current_usd_mep': 'Current price in USD via MEP',
      'tip.current_usd': 'Current market price in USD',
      'tip.price_change_ars': 'Price change in ARS since purchase',
      'tip.price_change_usd': 'Price change in USD since purchase',
      'tip.peso_movement': 'Peso movement: MEP went from ${from} to current rate',
      'tip.no_fx': 'No FX conversion \u2014 already in USD',
      'tip.total_return_usd': 'Total return in USD since purchase',
      'tip.position_value': 'Total position value in USD',
      'tip.pnl_usd': 'Profit or loss in USD',
      'tip.weight': '% of total portfolio value in USD',
      'tip.ratio': 'Ratio: ${ratio} (CEDEARs per share)',

      'tip.at_ath': 'At or near all-time high',
      'tip.far_ath': 'More than 50% below ATH',
      'tip.below_ath': '% below all-time high',
      'tip.no_rsi': 'No RSI data',
      'tip.oversold': 'Oversold \u2014 stock under pressure',
      'tip.strong_momentum': 'Strong momentum',
      'tip.neutral_momentum': 'Neutral momentum',
      'tip.no_stoch': 'No stochastic data',
      'tip.oversold_zone': 'Oversold zone',
      'tip.overbought_zone': 'Overbought zone',
      'tip.neutral_zone': 'Neutral zone',
      'tip.k_above_d': 'K above D \u2014 bullish signal',
      'tip.k_below_d': 'K below D \u2014 bearish signal',
      'tip.from_oversold': ' (from oversold)',
      'tip.from_overbought': ' (from overbought)',
      'tip.supertrend_up': 'Bullish trend \u2014 price above Supertrend line',
      'tip.supertrend_down': 'Bearish trend \u2014 price below Supertrend line',
      'tip.supertrend_up_short': '\u25B2 Up',
      'tip.supertrend_down_short': '\u25BC Down',
      'tip.price_vs_sma': 'Price vs SMA${period} (${value})',
      'tip.sma_label': '${period}-day average',
      'tip.health_label': 'Health: ${score} (${parts})',
      'tip.current_price_usd': 'Current price in USD',

      'tip.no_benchmark': '${metric} \u2014 no sector benchmark',
      'tip.favorable': 'Favorable',
      'tip.in_line': 'In line',
      'tip.unfavorable': 'Unfavorable',
      'tip.vs_sector': '${label} vs ${sector} median',
      'tip.vs_sector_value': '${label} vs ${sector} median (${value})',
      'tip.earnings_growing': 'Earnings growing',
      'tip.earnings_declining': 'Earnings declining',
      'tip.no_data': 'No data',
      'tip.dividend_pct': 'Annual dividend as % of price',
      'tip.no_dividend': 'No dividend',
      'tip.benchmark_group': 'Benchmark comparison group',

      'type.cedear': 'CED',
      'type.arg_stock': 'ARG',
      'type.us_stock': 'US',
      'type.cedear_tip': 'CEDEAR \u2014 Argentine depositary receipt (priced in ARS, converted via MEP)',
      'type.arg_stock_tip': 'Argentine equity listed on BYMA (priced in ARS, converted via MEP)',
      'type.us_stock_tip': 'US equity (priced in USD)',

      'broker.balanz_tip': 'Balanz \u2014 Argentine broker',
      'broker.ib_tip': 'Interactive Brokers \u2014 US broker',
      'broker.unknown': 'Unknown broker',

      'filter.all': 'All',
      'option.cedear': 'CEDEAR',
      'option.arg_stock': 'Arg Stock',
      'option.us_stock': 'US Stock',

      'glossary.asset_types_title': 'Asset Types & Currency Conversion',
      'glossary.cedear_def': '<strong class="text-white">CEDEAR</strong> \u2014 Argentine Depositary Receipt. Local wrapper for US stocks, priced in ARS on BYMA. USD value derived via MEP rate. The ratio (e.g., 1:20) shows how many CEDEARs equal one US share.',
      'glossary.arg_stock_def': '<strong class="text-white">Argentine Stock</strong> \u2014 Equity listed on BYMA, priced in ARS. USD value derived via MEP rate.',
      'glossary.us_stock_def': '<strong class="text-white">US Stock</strong> \u2014 Equity listed on NYSE/NASDAQ, priced in USD. No currency conversion needed.',
      'glossary.mep_def': '<strong class="text-white">MEP (Dolar MEP)</strong> \u2014 Implicit USD exchange rate obtained via local bond pair trades (AL30/AL30D). Used to convert ARS-priced assets to USD. Source: Data912.',
      'glossary.ccl_def': '<strong class="text-white">CCL (Dolar CCL)</strong> \u2014 Implicit USD rate via ADR arbitrage (settles abroad). Used to display US stocks in ARS.',

      'glossary.portfolio_title': 'Portfolio',
      'glossary.avg_ars_def': '<strong class="text-white">Avg ARS</strong> \u2014 Average purchase price in ARS per share. Only shown for Argentine assets (CEDEARs, Arg stocks).',
      'glossary.avg_usd_def': '<strong class="text-white">Avg USD</strong> \u2014 Average purchase price in USD per share.<br>Argentine assets: <code class="text-accent">avg_price_ars \u00F7 entry_mep_rate</code><br>US stocks: the purchase price itself (already in USD).',
      'glossary.price_usd_def': '<strong class="text-white">Price USD</strong> \u2014 Current market price in USD.<br>Argentine assets: <code class="text-accent">current_price_ars \u00F7 current_mep_rate</code><br>US stocks: the market price itself.',
      'glossary.price_pct_def': '<strong class="text-white">Price %</strong> \u2014 Price change since purchase in the asset\'s native currency.<br><code class="text-accent">(current_price \u2212 avg_price) \u00F7 avg_price \u00D7 100</code>',
      'glossary.currency_pct_def': '<strong class="text-white">Currency %</strong> \u2014 Change in the MEP rate since purchase, reflecting peso depreciation or appreciation. Only applies to Argentine assets.<br><code class="text-accent">(entry_mep_rate \u00F7 current_mep_rate \u2212 1) \u00D7 100</code>',
      'glossary.usd_ret_def': '<strong class="text-white">USD Ret %</strong> \u2014 Total return in USD, combining price and currency effects. Compounding avoids overstating or understating the real USD result.<br><code class="text-accent">(1 + price%) \u00D7 (1 + currency%) \u2212 1</code>',
      'glossary.value_usd_def': '<strong class="text-white">Value USD</strong> \u2014 Total position value in USD.<br><code class="text-accent">shares \u00D7 price_usd</code>',
      'glossary.pnl_usd_def': '<strong class="text-white">USD P&L</strong> \u2014 Profit or loss in US dollars.<br><code class="text-accent">(price_usd \u2212 avg_usd) \u00D7 shares</code>',
      'glossary.weight_def': '<strong class="text-white">Weight %</strong> \u2014 Position size as a percentage of total portfolio value.<br><code class="text-accent">value_usd \u00F7 total_portfolio_usd \u00D7 100</code>',

      'glossary.technicals_title': 'Technicals',
      'glossary.technicals_intro': 'Colors show <strong class="text-white">portfolio health</strong>: <span class="text-gain">green</span> = holding is strong, <span class="text-loss">red</span> = holding is struggling. Colors fade through white \u2014 only extremes get full color.',
      'glossary.ath_def': '<strong class="text-white">% Below ATH</strong> \u2014 How far the current price is below its all-time high.<br><span class="text-gain">Full green</span> at 0% (at ATH), fades to white at 15%, <span class="text-loss">full red</span> at 30%+.<br><code class="text-accent">(price \u00F7 all_time_high \u2212 1) \u00D7 100</code>',
      'glossary.rsi_def': '<strong class="text-white">RSI(14)</strong> \u2014 Relative Strength Index over 14 periods. Measures momentum by comparing average gains vs average losses.<br><span class="text-loss">Full red</span> \u226420 (deeply oversold), fades to white at 30, white 30\u201370 (neutral), fades to green at 80, <span class="text-gain">full green</span> \u226580 (strong momentum).<br><code class="text-accent">100 \u2212 100 \u00F7 (1 + avg_gain \u00F7 avg_loss)</code>',
      'glossary.stoch_def': '<strong class="text-white">Stoch K/D</strong> \u2014 Stochastic oscillator. %K = where price closed vs the high-low range (14 periods). %D = 3-period SMA of %K. When K crosses above D, momentum is shifting up (and vice versa).<br><span class="text-loss">Full red</span> at 0 (deeply oversold), fades to white at 20, white 20\u201380 (neutral), fades to green at 80, <span class="text-gain">full green</span> at 100.<br><code class="text-accent">%K = (close \u2212 low\u2081\u2084) \u00F7 (high\u2081\u2084 \u2212 low\u2081\u2084) \u00D7 100</code>',
      'glossary.supertrend_def': '<strong class="text-white">Supertrend</strong> \u2014 Trend-following indicator based on Average True Range (ATR).<br><span class="text-gain">Green</span> = uptrend (price above band), <span class="text-loss">red</span> = downtrend (price below band).<br><code class="text-accent">upper = (high + low) \u00F7 2 + multiplier \u00D7 ATR</code>',
      'glossary.sma_def': '<strong class="text-white">vs SMA20 / vs SMA50</strong> \u2014 How far the price is above or below the 20/50-day simple moving average, shown as %.<br>White within \u00B11%, fades to <span class="text-gain">full green</span> at +10% (above SMA) or <span class="text-loss">full red</span> at \u221210% (below SMA). Tooltip shows actual SMA value. For CEDEARs, uses the underlying US stock price for comparison.<br><code class="text-accent">(price \u2212 SMA) \u00F7 SMA \u00D7 100</code>',
      'glossary.health_def': '<strong class="text-white">Health</strong> \u2014 Combined score from 5 indicators. Each contributes +1 (bullish) or \u22121 (bearish):<br>RSI \u226550 = +1, Stoch K > D = +1, Supertrend up = +1, price > SMA20 = +1, price > SMA50 = +1.<br>Range: <span class="text-gain">+5</span> (all bullish) to <span class="text-loss">\u22125</span> (all bearish). Hover for per-indicator breakdown.',

      'glossary.fundamentals_title': 'Fundamentals',
      'glossary.fundamentals_intro': 'Metrics with color are compared to <strong class="text-white">sector medians</strong>: <span class="text-gain">green</span> = better than sector, <span style="color: #d29922">yellow</span> = near sector average, <span class="text-loss">red</span> = worse than sector. When no sector data is available, absolute thresholds are used.',
      'glossary.pe_def': '<strong class="text-white">P/E</strong> \u2014 Price to trailing twelve-month earnings. Lower is better (cheaper valuation). <span class="text-gain">Green</span> below sector median, <span class="text-loss">red</span> above 1.5\u00D7.<br><code class="text-accent">share_price \u00F7 earnings_per_share</code>',
      'glossary.fwd_pe_def': '<strong class="text-white">Fwd P/E</strong> \u2014 Price to estimated forward earnings. Same interpretation as P/E but based on analyst estimates.<br><code class="text-accent">share_price \u00F7 estimated_future_eps</code>',
      'glossary.pb_def': '<strong class="text-white">P/B</strong> \u2014 Price to book value per share. Compares market price to accounting value.<br><code class="text-accent">share_price \u00F7 book_value_per_share</code>',
      'glossary.roe_def': '<strong class="text-white">ROE %</strong> \u2014 Return on equity. Higher is better (efficient use of capital). <span class="text-gain">Green</span> above sector median, <span class="text-loss">red</span> below 50% of it.<br><code class="text-accent">net_income \u00F7 shareholder_equity \u00D7 100</code>',
      'glossary.eps_gr_def': '<strong class="text-white">EPS Gr %</strong> \u2014 Year-over-year earnings per share growth.<br><code class="text-accent">(eps_current \u2212 eps_prior) \u00F7 |eps_prior| \u00D7 100</code>',
      'glossary.div_yld_def': '<strong class="text-white">Div Yld %</strong> \u2014 Annual dividend yield as a percentage of share price.<br><code class="text-accent">annual_dividends \u00F7 share_price \u00D7 100</code>',
      'glossary.de_def': '<strong class="text-white">D/E</strong> \u2014 Debt to equity ratio. Lower is better (less leverage). <span class="text-gain">Green</span> below sector median, <span class="text-loss">red</span> above 2\u00D7.<br><code class="text-accent">total_debt \u00F7 shareholder_equity</code>',
      'glossary.margin_def': '<strong class="text-white">Margin %</strong> \u2014 Net profit margin. Higher is better. <span class="text-gain">Green</span> above sector median, <span class="text-loss">red</span> below 50% of it.<br><code class="text-accent">net_income \u00F7 revenue \u00D7 100</code>',
    }
  },

  t(key, vars) {
    const str = this.translations[this._lang]?.[key] || this.translations.es[key] || key;
    if (!vars) return str;
    return str.replace(/\$\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  },

  lang() {
    return this._lang;
  },

  setLang(lang) {
    this._lang = lang;
    localStorage.setItem('argpt_lang', lang);
    this._applyToDOM();
  },

  init() {
    this._lang = localStorage.getItem('argpt_lang') || 'es';
    this._applyToDOM();
  },

  _applyToDOM() {
    document.documentElement.lang = this._lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const text = this.t(key);
      if (el.dataset.i18nHtml !== undefined) {
        el.innerHTML = text;
      } else {
        el.textContent = text;
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = this.t(el.dataset.i18nTitle);
    });

    document.querySelectorAll('.lang-toggle').forEach(btn => {
      btn.textContent = this.t('lang.toggle');
    });
  }
};
