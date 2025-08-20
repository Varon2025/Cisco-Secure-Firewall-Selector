
// Lightweight state & utils
const state = {
  data: null,
  products: [],
  discounts: { hw: 0.6, sw: 0.6, sssnt: 0.6 },
  terms: [],
  filters: { q: "", family: "", fwMin: 0, thMin: 0, ipsMin: 0, form: "" },
};

const fmtCurrency = (v) => (v == null ? "-" : new Intl.NumberFormat("fr-FR", { style:"currency", currency:"USD" }).format(v));
const sanitize = (s) => (s || "").toString().trim().toUpperCase();

function loadJSON(){
  return fetch("./data/firewalls.json").then(r=>r.json());
}

function unique(arr){ return Array.from(new Set(arr)); }

function initUI(){
  // Wire filters (no pre-checked defaults, per requirement)
  const q = document.getElementById("search");
  const family = document.getElementById("family");
  const fwMin = document.getElementById("fwMin");
  const fwMinVal = document.getElementById("fwMinVal");
  const thMin = document.getElementById("thMin");
  const thMinVal = document.getElementById("thMinVal");
  const ipsMin = document.getElementById("ipsMin");
  const ipsMinVal = document.getElementById("ipsMinVal");
  const formFactor = document.getElementById("formFactor");
  const resetBtn = document.getElementById("resetFilters");

  function onChange(){
    state.filters.q = q.value.trim();
    state.filters.family = family.value;
    state.filters.fwMin = parseFloat(fwMin.value || "0");
    state.filters.thMin = parseFloat(thMin.value || "0");
    state.filters.ipsMin = parseFloat(ipsMin.value || "0");
    state.filters.form = formFactor.value;
    renderResults();
  }

  q.addEventListener("input", onChange);
  family.addEventListener("change", onChange);
  formFactor.addEventListener("change", onChange);

  fwMin.addEventListener("input", ()=>{
    fwMinVal.textContent = fwMin.value;
    onChange();
  });
  thMin.addEventListener("input", ()=>{
    thMinVal.textContent = thMin.value;
    onChange();
  });
  ipsMin.addEventListener("input", ()=>{
    ipsMinVal.textContent = ipsMin.value;
    onChange();
  });

  resetBtn.addEventListener("click", ()=>{
    q.value = "";
    family.value = "";
    formFactor.value = "";
    fwMin.value = 0; fwMinVal.textContent = "0";
    thMin.value = 0; thMinVal.textContent = "0";
    ipsMin.value = 0; ipsMinVal.textContent = "0";
    onChange();
  });

  document.getElementById("exportCsvBtn").addEventListener("click", exportCsv);

  // Discounts
  const dHW = document.getElementById("discHW");
  const dSW = document.getElementById("discSW");
  const dSSSNT = document.getElementById("discSSSNT");
  function updateDisc(){
    state.discounts = { hw: parseFloat(dHW.value||"0"), sw: parseFloat(dSW.value||"0"), sssnt: parseFloat(dSSSNT.value||"0") };
    renderPane(document.querySelector('.compare-pane[data-pane="A"]'));
    renderPane(document.querySelector('.compare-pane[data-pane="B"]'));
  }
  [dHW, dSW, dSSSNT].forEach(el=>el.addEventListener("input", updateDisc));
}

function setupFamilyFilter(){
  const sel = document.getElementById("family");
  const families = unique(state.products.map(p=>p.family).filter(Boolean)).sort();
  families.forEach(f=>{
    const opt = document.createElement("option");
    opt.value = f; opt.textContent = f;
    sel.appendChild(opt);
  });
}

function renderResults(){
  const tbody = document.querySelector("#resultsTable tbody");
  tbody.innerHTML = "";
  let rows = 0;

  // Apply filters
  const f = state.filters;
  const q = sanitize(f.q);

  const filtered = state.products.filter(p => {
    if (q){
      const inText = (p.model + " " + (p.family||"")).toUpperCase();
      if (!inText.includes(q)) return false;
    }
    if (f.family && p.family !== f.family) return false;
    if (f.form && !(p.form_factor||"").toLowerCase().includes(f.form.toLowerCase())) return false;

    const fw = p.perf?.fw_gbps ?? 0;
    const th = p.perf?.threat_gbps ?? 0;
    const ips = p.perf?.ips_gbps ?? 0;
    if (fw < f.fwMin) return false;
    if (th < f.thMin) return false;
    if (ips < f.ipsMin) return false;
    return true;
  });

  filtered.forEach(p=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.model}</td>
      <td>${p.family||"-"}</td>
      <td>${p.form_factor||"-"}</td>
      <td>${p.perf?.fw_gbps ?? "-"}</td>
      <td>${p.perf?.threat_gbps ?? "-"}</td>
      <td>${p.perf?.ips_gbps ?? "-"}</td>
      <td>${fmtCurrency(p.hardware?.gpl)}</td>
    `;
    tbody.appendChild(tr);
    rows++;
  });

  document.getElementById("count").textContent = rows.toString();
}

function exportCsv(){
  const headers = ["Modèle","Série","Form factor","FW Gbps","Threat Gbps","IPS Gbps","GPL HW"];
  const lines = [headers.join(";")];
  // Export current filtered results
  const f = state.filters;
  const q = sanitize(f.q);
  const filtered = state.products.filter(p => {
    if (q){
      const inText = (p.model + " " + (p.family||"")).toUpperCase();
      if (!inText.includes(q)) return false;
    }
    if (f.family && p.family !== f.family) return false;
    if (f.form && !(p.form_factor||"").toLowerCase().includes(f.form.toLowerCase())) return false;
    const fw = p.perf?.fw_gbps ?? 0;
    const th = p.perf?.threat_gbps ?? 0;
    const ips = p.perf?.ips_gbps ?? 0;
    if (fw < f.fwMin) return false;
    if (th < f.thMin) return false;
    if (ips < f.ipsMin) return false;
    return true;
  });

  filtered.forEach(p=>{
    lines.push([
      p.model,
      p.family||"",
      p.form_factor||"",
      p.perf?.fw_gbps ?? "",
      p.perf?.threat_gbps ?? "",
      p.perf?.ips_gbps ?? "",
      p.hardware?.gpl ?? ""
    ].join(";"));
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "firewalls_filtered.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Compare panes ----------
function setupComparePanes(){
  document.querySelectorAll(".compare-pane").forEach(pane=>{
    // Terms
    const termsHost = pane.querySelector('.radio-group[data-role="terms"]');
    termsHost.innerHTML = "";
    state.terms.forEach(y => {
      const id = `term-${pane.dataset.pane}-${y}`;
      const w = document.createElement("label");
      w.innerHTML = `<input type="radio" name="term-${pane.dataset.pane}" value="${y}" id="${id}"> ${y} ans`;
      termsHost.appendChild(w);
    });
    // No default selected (user must pick)
    // Model datalist
    const dl = document.getElementById("models-list");
    if (!dl.dataset.populated){
      state.products.forEach(p=>{
        const opt = document.createElement("option");
        opt.value = p.model;
        dl.appendChild(opt);
      });
      dl.dataset.populated = "1";
    }

    // Events
    pane.querySelector(".pane-model").addEventListener("change", ()=>renderPane(pane));
    pane.querySelectorAll(`[name="term-${pane.dataset.pane}"]`).forEach(r=>r.addEventListener("change", ()=>renderPane(pane)));
    pane.querySelector(".opt-amp").addEventListener("change", ()=>renderPane(pane));
    pane.querySelector(".opt-url").addEventListener("change", ()=>renderPane(pane));
    pane.querySelector(".opt-sssnt").addEventListener("change", ()=>renderPane(pane));
    pane.querySelector(".clear-pane").addEventListener("click", ()=>{
      pane.querySelector(".pane-model").value = "";
      pane.querySelectorAll(`[name="term-${pane.dataset.pane}"]`).forEach(r=>r.checked=false);
      pane.querySelector(".opt-amp").checked = false;
      pane.querySelector(".opt-url").checked = false;
      pane.querySelector(".opt-sssnt").checked = false;
      renderPane(pane);
    });
  });
}

function renderPane(pane){
  const model = sanitize(pane.querySelector(".pane-model").value);
  const termEl = Array.from(pane.querySelectorAll(`[name="term-${pane.dataset.pane}"]`)).find(r=>r.checked);
  const years = termEl ? parseInt(termEl.value,10) : null;
  const needAmp = pane.querySelector(".opt-amp").checked;
  const needUrl = pane.querySelector(".opt-url").checked;
  const needSSSNT = pane.querySelector(".opt-sssnt").checked;

  const tbody = pane.querySelector(".price-table tbody");
  tbody.innerHTML = "";

  const total = { gpl: 0, net: 0 };
  const addRow = (label, sku, gpl, type) => {
    const net = (gpl==null) ? null :
      (type==="HW" ? gpl*state.discounts.hw :
       type==="SSSNT" ? gpl*state.discounts.sssnt :
       gpl*state.discounts.sw);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${label}</td><td>${sku||"-"}</td><td>${fmtCurrency(gpl)}</td><td>${net==null?"-":fmtCurrency(net)}</td>`;
    tbody.appendChild(tr);
    if (gpl!=null){ total.gpl += gpl; total.net += (net||0); }
  };

  if (!model){ pane.querySelector(".price-table .gpl").textContent = "-"; pane.querySelector(".price-table .net").textContent = "-"; return; }

  // Find product
  const product = state.products.find(p=>sanitize(p.model)===model);
  if (!product){ pane.querySelector(".price-table .gpl").textContent = "-"; pane.querySelector(".price-table .net").textContent = "-"; return; }

  // HW
  addRow("Hardware", product.hardware?.sku, product.hardware?.gpl ?? null, "HW");

  // License logic
  const lic = product.licenses || { roots:{}, prices:{} };
  const roots = lic.roots || {};
  const prices = lic.prices || {};

  // We must always include T, then optionally AMP and/or URL. Prefer the combined SKU if present for the chosen term.
  const yKey = years ? String(years) : null;
  // Helper to fetch price for a root + years
  const priceFor = (root) => {
    if (!root || !yKey) return null;
    const p = prices[root]?.[yKey];
    return p ? { sku: p.sku, gpl: p.gpl } : null;
  };

  let licRow = null;
  if (!years){
    // No term picked yet
    addRow("Licence (choisir durée)", null, null, "SW");
  } else {
    if (needAmp && needUrl){
      licRow = priceFor("tmc") || ( (()=>{
        const pt = priceFor("t");
        const pa = priceFor("amp");
        const pu = priceFor("url");
        if (pt && pa && pu){
          addRow("Licence T", pt.sku, pt.gpl, "SW");
          addRow("Licence AMP", pa.sku, pa.gpl, "SW");
          addRow("Licence URL", pu.sku, pu.gpl, "SW");
          return { sku: "T+AMP+URL (somme)", gpl: pt.gpl + pa.gpl + pu.gpl };
        }
        return null;
      })() ) || null;
    } else if (needAmp && !needUrl){
      licRow = priceFor("tm") || ( (()=>{
        const pt = priceFor("t");
        const pa = priceFor("amp");
        if (pt && pa){
          addRow("Licence T", pt.sku, pt.gpl, "SW");
          addRow("Licence AMP", pa.sku, pa.gpl, "SW");
          return { sku: "T+AMP (somme)", gpl: pt.gpl + pa.gpl };
        }
        return null;
      })() ) || null;
    } else if (!needAmp && needUrl){
      licRow = priceFor("tc") || ( (()=>{
        const pt = priceFor("t");
        const pu = priceFor("url");
        if (pt && pu){
          addRow("Licence T", pt.sku, pt.gpl, "SW");
          addRow("Licence URL", pu.sku, pu.gpl, "SW");
          return { sku: "T+URL (somme)", gpl: pt.gpl + pu.gpl };
        }
        return null;
      })() ) || null;
    } else {
      // T only
      licRow = priceFor("t");
    }

    if (licRow){
      addRow("Licence", licRow.sku, licRow.gpl, "SW");
    } else if (years){
      addRow("Licence (SKU manquant)", null, null, "SW");
    }
  }

  // Support (SSSNT 12 mois)
  if (needSSSNT && product.support?.sku){
    addRow("Support SSSNT (12 mois)", product.support.sku, product.support.gpl ?? null, "SSSNT");
  }

  // Totals
  pane.querySelector(".price-table .gpl").textContent = fmtCurrency(total.gpl);
  pane.querySelector(".price-table .net").textContent = fmtCurrency(total.net);
}

async function main(){
  state.data = await loadJSON();
  state.products = state.data.products || [];
  state.terms = (state.data.meta?.license_terms_supported || [1,3,5]).sort((a,b)=>a-b);

  initUI();
  setupFamilyFilter();
  setupComparePanes();
  renderResults();
}

main();
