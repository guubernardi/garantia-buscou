// Configuração e constantes
const STORAGE_KEY = "planilha_reclamacoes_v2"
const COLS = [
  { key: "data_controle", label: "DATA CONTROLE", type: "date" },
  { key: "data_controle_loja", label: "DATA CONTROLE LOJA", type: "date" },
  { key: "sku", label: "SKU", type: "text" },
  { key: "reclamacao", label: "RECLAMAÇÃO", type: "text" },
  { key: "id_venda", label: "ID DE VENDA", type: "text" },
  { key: "tipo", label: "TIPO RECLAMAÇÃO", type: "text" },
  { key: "status", label: "STATUS", type: "status" },
  { key: "responsavel", label: "RESPONSAVEL", type: "text" },
  { key: "valor", label: "VALOR", type: "money" },
  { key: "obs", label: "Observações", type: "text" },
  { key: "data_baixa", label: "DATA BAIXA", type: "date" },
]

// Estado da aplicação
let data = []
let selectedRowIndex = null
const sortState = { col: null, dir: 1 }

// Formatadores
const fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

const parseBRL = (str) => {
  if (typeof str === "number") return str
  if (!str) return 0
  const s = String(str)
    .replace(/[^0-9,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".")
  const n = Number.parseFloat(s)
  return isNaN(n) ? 0 : n
}

const todayISO = () => new Date().toISOString().slice(0, 10)

// Função para criar status pill
const makeStatusPill = (value) => {
  const v = (value || "").toLowerCase()
  let className = "status-pill"
  if (v.includes("abert")) className += " status-pill--warning"
  else if (v.includes("resol")) className += " status-pill--success"
  else if (v.includes("cancel")) className += " status-pill--danger"
  else if (v.includes("análise")) className += " status-pill--info"

  return `<span class="${className}">${value || ""}</span>`
}

// Função para filtrar e ordenar dados
const filteredAndSortedData = () => {
  const searchQuery = document.getElementById("searchInput").value
  const statusFilter = document.getElementById("statusFilter").value

  const rows = [...data]

  // Ordenação
  if (sortState.col !== null) {
    const col = COLS[sortState.col]
    rows.sort((a, b) => {
      let va = a[col.key] ?? ""
      let vb = b[col.key] ?? ""
      if (col.type === "money") {
        va = parseBRL(va)
        vb = parseBRL(vb)
      }
      return (va > vb ? 1 : va < vb ? -1 : 0) * sortState.dir
    })
  }

  // Filtros
  return rows.filter((r) => {
    const statusOk =
      !statusFilter ||
      String(r.status || "")
        .toLowerCase()
        .includes(statusFilter.toLowerCase())
    const text = Object.values(r).join(" ").toLowerCase()
    const queryOk = !searchQuery || text.includes(searchQuery.toLowerCase())
    return statusOk && queryOk
  })
}

// Função para atualizar apenas os totais
const updateTotals = () => {
  const filteredRows = filteredAndSortedData()
  const totalValue = filteredRows.reduce((acc, r) => acc + parseBRL(r.valor), 0)
  document.getElementById("totalValue").textContent = fmtBRL.format(totalValue)
  document.getElementById("rowCount").textContent = filteredRows.length
}

// Função para renderizar a tabela
const renderTable = () => {
  const tbody = document.getElementById("tableBody")
  const filteredRows = filteredAndSortedData()

  tbody.innerHTML = ""

  filteredRows.forEach((row, index) => {
    const originalIndex = data.indexOf(row)
    const tr = document.createElement("tr")
    tr.className = `table-row ${selectedRowIndex === originalIndex ? "selected" : ""}`
    tr.onclick = () => selectRow(originalIndex)

    COLS.forEach((col) => {
      const td = document.createElement("td")
      td.className = "table-cell"

      if (col.type === "status") {
        td.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <select class="input-field text-sm w-full" 
                                id="status-${originalIndex}"
                                onclick="event.stopPropagation()"
                                onchange="updateCellAndPreventRerender(${originalIndex}, '${col.key}', this.value)">
                            <option value="">Selecione...</option>
                            <option value="Aberta" ${row[col.key] === "Aberta" ? "selected" : ""}>Aberta</option>
                            <option value="Em Análise" ${row[col.key] === "Em Análise" ? "selected" : ""}>Em Análise</option>
                            <option value="Resolvida" ${row[col.key] === "Resolvida" ? "selected" : ""}>Resolvida</option>
                            <option value="Cancelada" ${row[col.key] === "Cancelada" ? "selected" : ""}>Cancelada</option>
                        </select>
                        ${makeStatusPill(row[col.key])}
                    </div>
                `
      } else if (col.type === "date") {
        td.innerHTML = `
                    <input type="date" 
                           value="${(row[col.key] || "").slice(0, 10)}" 
                           class="input-field text-sm w-full"
                           onclick="event.stopPropagation()"
                           onchange="updateCell(${originalIndex}, '${col.key}', this.value)">
                `
      } else if (col.type === "money") {
        const displayValue = row[col.key] || ""
        td.innerHTML = `
                    <input type="text" 
                           value="${displayValue}" 
                           class="input-field text-sm w-full"
                           placeholder="R$ 0,00"
                           onclick="event.stopPropagation()"
                           oninput="debouncedHandleMoneyInput(${originalIndex}, '${col.key}', this.value)"
                           onblur="formatMoneyOnBlur(this, ${originalIndex}, '${col.key}')">
                `
      } else {
        const inputHandler =
          col.key === "sku"
            ? `oninput="handleTextInput(${originalIndex}, '${col.key}', this.value)"`
            : `oninput="debouncedUpdateCell(${originalIndex}, '${col.key}', this.value)"`

        td.innerHTML = `
                    <input type="text" 
                           value="${row[col.key] || ""}" 
                           class="input-field text-sm w-full"
                           onclick="event.stopPropagation()"
                           ${inputHandler}
                           onkeydown="handleKeyDown(event)"
                           onfocus="this.select()"
                           autocomplete="off">
                `
      }

      tr.appendChild(td)
    })

    tbody.appendChild(tr)
  })

  updateTotals()
}

// Função para selecionar linha
const selectRow = (index) => {
  selectedRowIndex = index
  renderTable()
}

// Função para atualizar célula
const updateCell = (rowIndex, key, value) => {
  data[rowIndex] = { ...data[rowIndex], [key]: value }
  saveData()

  // Atualizar apenas os totais sem re-renderizar toda a tabela
  updateTotals()
}

// Função para lidar com input de dinheiro
const handleMoneyInput = (rowIndex, key, value) => {
  // Atualizar o valor no data sem formatação primeiro
  data[rowIndex] = { ...data[rowIndex], [key]: value }
  saveData()
  updateTotals()
}

// Função para formatar dinheiro no blur
const formatMoneyOnBlur = (input, rowIndex, key) => {
  const value = input.value
  if (value && !value.startsWith("R$")) {
    const num = parseBRL(value)
    if (num > 0) {
      input.value = fmtBRL.format(num)
      data[rowIndex] = { ...data[rowIndex], [key]: input.value }
      saveData()
      updateTotals()
    }
  }
}

// Função para adicionar linha
const addRow = () => {
  const newRow = {
    data_controle: todayISO(),
    data_controle_loja: todayISO(),
    sku: "",
    reclamacao: "",
    id_venda: "",
    tipo: "",
    status: "Aberta",
    responsavel: "",
    valor: "",
    obs: "",
    data_baixa: "",
  }
  data.push(newRow)
  saveData()
  renderTable()
}

// Função para duplicar linha
const duplicateRow = () => {
  if (selectedRowIndex === null) {
    alert("Selecione uma linha primeiro.")
    return
  }
  const clone = { ...data[selectedRowIndex] }
  data.splice(selectedRowIndex + 1, 0, clone)
  saveData()
  renderTable()
}

// Função para excluir linha
const deleteRow = () => {
  if (selectedRowIndex === null) {
    alert("Selecione uma linha para excluir.")
    return
  }
  if (confirm("Excluir a linha selecionada?")) {
    data.splice(selectedRowIndex, 1)
    selectedRowIndex = null
    saveData()
    renderTable()
  }
}

// Função para limpar tudo
const clearAll = () => {
  if (confirm("Tem certeza? Isso limpará a planilha e o armazenamento local.")) {
    data = []
    selectedRowIndex = null
    saveData()
    renderTable()
  }
}

// Função para ordenar
const handleSort = (colIndex) => {
  if (sortState.col === colIndex) {
    sortState.dir = sortState.dir === 1 ? -1 : 1
  } else {
    sortState.col = colIndex
    sortState.dir = 1
  }

  // Atualizar ícones de ordenação
  document.querySelectorAll(".sort-icon").forEach((icon, index) => {
    if (index === colIndex) {
      icon.innerHTML = sortState.dir === 1 ? "↑" : "↓"
    } else {
      icon.innerHTML = '<i data-lucide="arrow-up-down"></i>'
    }
  })

  renderTable()
}

// Função para exportar CSV
const exportCSV = () => {
  const header = COLS.map((c) => `"${c.label}"`).join(",")
  const lines = data.map((r) =>
    COLS.map((c) => {
      const v = r[c.key] ?? ""
      const s = c.type === "money" ? parseBRL(v) || 0 : v
      return `"${String(s).replace(/"/g, '""')}"`
    }).join(","),
  )
  const csv = [header, ...lines].join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `planilha-reclamacoes-${todayISO()}.csv`
  a.click()
}

// Função para exportar JSON
const exportJSON = () => {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `planilha-reclamacoes-${todayISO()}.json`
  a.click()
}

// Função para salvar dados
const saveData = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Função para carregar dados
const loadData = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      data = JSON.parse(saved)
    } catch {
      data = []
    }
  } else {
    // Dados de exemplo
    data = [
      {
        data_controle: todayISO(),
        data_controle_loja: todayISO(),
        sku: "MLB123-456",
        reclamacao: "Cliente relata atraso de entrega",
        id_venda: "ABCD1234",
        tipo: "Logística",
        status: "Em Análise",
        responsavel: "Rodrigo",
        valor: fmtBRL.format(59.9),
        obs: "Abrir chamado com transportadora",
        data_baixa: "",
      },
    ]
  }
}

const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

const debouncedUpdateCell = debounce((rowIndex, key, value) => {
  updateCell(rowIndex, key, value)
}, 100) // Reduzido para 100ms para melhor responsividade

const debouncedHandleMoneyInput = debounce((rowIndex, key, value) => {
  handleMoneyInput(rowIndex, key, value)
}, 600)

// Função para atualizar célula e prevenir re-renderização
const updateCellAndPreventRerender = (rowIndex, key, value) => {
  data[rowIndex] = { ...data[rowIndex], [key]: value }
  saveData()

  // Atualizar apenas o status pill correspondente sem re-renderizar toda a tabela
  const statusPill = document.querySelector(`#status-${rowIndex}`).parentElement.querySelector(".status-pill")
  if (statusPill) {
    statusPill.outerHTML = makeStatusPill(value)
  }

  // Atualizar totais se necessário
  updateTotals()
}

const handleTextInput = (rowIndex, key, value) => {
  data[rowIndex] = { ...data[rowIndex], [key]: value }
  saveData()
  updateTotals()
}

// Função para melhorar navegação com teclado
const handleKeyDown = (event) => {
  // Permitir navegação normal sem interferir na digitação
  if (event.key === "Enter") {
    event.target.blur()
  }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  loadData()
  renderTable()

  // Event listeners
  document.getElementById("addRowBtn").onclick = addRow
  document.getElementById("duplicateRowBtn").onclick = duplicateRow
  document.getElementById("deleteRowBtn").onclick = deleteRow
  document.getElementById("clearAllBtn").onclick = clearAll
  document.getElementById("exportCSVBtn").onclick = exportCSV
  document.getElementById("exportJSONBtn").onclick = exportJSON

  // Debounce para busca para evitar re-renderização excessiva
  const debouncedSearch = debounce(() => renderTable(), 300)
  document.getElementById("searchInput").oninput = debouncedSearch
  document.getElementById("statusFilter").onchange = renderTable

  // Event listeners para ordenação
  document.querySelectorAll(".sortable").forEach((th, index) => {
    th.onclick = () => handleSort(index)
  })
})
