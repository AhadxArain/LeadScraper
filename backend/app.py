import streamlit as st
import pandas as pd
import io
from scraper_engine import run_scraper
from storage.csv_store import (
    load_valid_leads,
    load_rejected_leads,
    load_existing_leads,
    load_run_logs,
    load_all_time_unique_leads,
    clear_all_data,
)

st.set_page_config(
    page_title="LeadScraper Pro",
    page_icon="🎯",
    layout="wide",
)

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
}

.stApp {
    background: #f0f4ff;
    color: #0f1117;
}

[data-testid="stSidebar"] {
    background: #ffffff !important;
    border-right: 1px solid #e2e8f0 !important;
    box-shadow: 4px 0 24px rgba(99,102,241,0.06) !important;
}
[data-testid="stSidebar"] * {
    color: #374151 !important;
}

.sidebar-brand {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: #4f46e5 !important;
    letter-spacing: -0.5px;
    margin-bottom: 2px;
}
.sidebar-sub {
    font-size: 10px;
    font-weight: 600;
    color: #a5b4fc !important;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 24px;
}

[data-testid="stTextInput"] input,
[data-testid="stNumberInput"] input {
    background: #f8faff !important;
    border: 1.5px solid #e0e7ff !important;
    border-radius: 10px !important;
    color: #1e1b4b !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 14px !important;
    transition: all 0.2s ease;
}
[data-testid="stTextInput"] input:focus,
[data-testid="stNumberInput"] input:focus {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important;
    background: #ffffff !important;
}
[data-testid="stTextInput"] label,
[data-testid="stNumberInput"] label {
    color: #6b7280 !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    letter-spacing: 0.3px !important;
}

[data-testid="stButton"] > button {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 12px !important;
    font-family: 'Syne', sans-serif !important;
    font-weight: 700 !important;
    font-size: 14px !important;
    letter-spacing: 0.3px !important;
    padding: 12px 24px !important;
    box-shadow: 0 4px 15px rgba(99,102,241,0.3) !important;
    transition: all 0.2s ease !important;
}
[data-testid="stButton"] > button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(99,102,241,0.45) !important;
}
[data-testid="stButton"] > button[kind="secondary"],
[data-testid="stButton"] > button:last-child {
    background: #ffffff !important;
    color: #6366f1 !important;
    border: 1.5px solid #e0e7ff !important;
    box-shadow: none !important;
}

[data-testid="stDownloadButton"] > button {
    background: #ffffff !important;
    color: #6366f1 !important;
    border: 1.5px solid #e0e7ff !important;
    border-radius: 10px !important;
    font-family: 'Inter', sans-serif !important;
    font-weight: 600 !important;
    font-size: 13px !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 1px 4px rgba(99,102,241,0.08) !important;
}
[data-testid="stDownloadButton"] > button:hover {
    border-color: #6366f1 !important;
    box-shadow: 0 4px 12px rgba(99,102,241,0.2) !important;
}

[data-testid="stMetric"] {
    background: #ffffff;
    border: 1.5px solid #e0e7ff;
    border-radius: 16px;
    padding: 20px 24px;
    box-shadow: 0 2px 12px rgba(99,102,241,0.07);
}
[data-testid="stMetricLabel"] {
    font-size: 11px !important;
    letter-spacing: 2px !important;
    text-transform: uppercase !important;
    color: #9ca3af !important;
    font-weight: 600 !important;
}
[data-testid="stMetricValue"] {
    font-family: 'Syne', sans-serif !important;
    font-size: 32px !important;
    font-weight: 800 !important;
    color: #4f46e5 !important;
}

[data-testid="stTabs"] [data-baseweb="tab-list"] {
    background: #ffffff;
    border-radius: 14px;
    padding: 5px;
    gap: 3px;
    border: 1.5px solid #e0e7ff;
    box-shadow: 0 2px 8px rgba(99,102,241,0.06);
}
[data-testid="stTabs"] [data-baseweb="tab"] {
    background: transparent !important;
    border-radius: 10px !important;
    color: #9ca3af !important;
    font-family: 'Inter', sans-serif !important;
    font-weight: 500 !important;
    font-size: 13px !important;
    padding: 8px 18px !important;
    transition: all 0.2s ease !important;
}
[data-testid="stTabs"] [aria-selected="true"] {
    background: #eef2ff !important;
    color: #4f46e5 !important;
    font-weight: 600 !important;
}

[data-testid="stDataFrame"] {
    border-radius: 14px !important;
    overflow: hidden !important;
    border: 1.5px solid #e0e7ff !important;
    box-shadow: 0 2px 12px rgba(99,102,241,0.06) !important;
}

[data-testid="stAlert"] {
    border-radius: 14px !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 14px !important;
    border-left-width: 4px !important;
}

[data-testid="stProgressBar"] > div > div {
    background: linear-gradient(90deg, #6366f1, #8b5cf6) !important;
    border-radius: 99px !important;
}
[data-testid="stProgressBar"] > div {
    background: #e0e7ff !important;
    border-radius: 99px !important;
    height: 8px !important;
}

.main-title {
    font-family: 'Syne', sans-serif;
    font-size: 42px;
    font-weight: 800;
    letter-spacing: -1.5px;
    color: #1e1b4b;
    margin-bottom: 0;
    line-height: 1.1;
}
.main-subtitle {
    font-size: 12px;
    color: #a5b4fc;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 32px;
    font-weight: 600;
}

.stat-card {
    background: #ffffff;
    border: 1.5px solid #e0e7ff;
    border-radius: 20px;
    padding: 28px;
    box-shadow: 0 4px 20px rgba(99,102,241,0.08);
}

hr {
    border-color: #e0e7ff !important;
    margin: 16px 0 !important;
}

.stCaption, [data-testid="stCaptionContainer"] {
    color: #9ca3af !important;
    font-size: 12px !important;
}

::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: #f0f4ff; }
::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: #6366f1; }
</style>
""", unsafe_allow_html=True)

# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown('<div class="sidebar-brand">⬡ LeadScraper</div>', unsafe_allow_html=True)
    st.markdown('<div class="sidebar-sub">Pro Edition</div>', unsafe_allow_html=True)

    business_type = st.text_input("Business Type", placeholder="e.g. pizza shops")
    zip_code = st.text_input("ZIP Code", placeholder="e.g. 45001")
    required_leads = st.number_input(
        "Required Leads", min_value=1, max_value=500, value=20, step=5
    )

    st.markdown("---")
    start_btn = st.button("🚀 Start Scraping", type="primary", use_container_width=True)
    st.markdown("---")
    delete_btn = st.button("🗑️ Clear All Data", use_container_width=True)
    if delete_btn:
        clear_all_data()
        st.rerun()

    st.markdown("---")
    st.markdown(
        '<div style="font-size:11px;color:#c7d2fe;text-align:center;letter-spacing:1.5px;font-weight:600;">POWERED BY SERPER.DEV</div>',
        unsafe_allow_html=True
    )

# ── Main header ───────────────────────────────────────────────────────────────
st.markdown('<div class="main-title">Lead Intelligence</div>', unsafe_allow_html=True)
st.markdown('<div class="main-subtitle">Business Discovery & Contact Extraction Engine</div>', unsafe_allow_html=True)

# ── Live feedback placeholders ────────────────────────────────────────────────
status_box   = st.empty()
progress_bar = st.empty()
metrics_row  = st.empty()

# ── Tabs ──────────────────────────────────────────────────────────────────────
tab_alltime, tab_valid, tab_rejected, tab_existing, tab_logs = st.tabs([
    "🌟  All Time",
    "✅  Last Scraped Leads",
    "❌  Rejected",
    "🔄  Existing",
    "📋  Run Logs",
])

# ── Helpers ───────────────────────────────────────────────────────────────────
def _to_excel_bytes(df: pd.DataFrame) -> bytes:
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Leads")
    return buffer.getvalue()

def _render_table(df: pd.DataFrame, filename_base: str, dl_key: str) -> None:
    if df.empty:
        st.markdown(
            '<div style="text-align:center;padding:56px 0;color:#c7d2fe;font-size:13px;font-weight:600;letter-spacing:2px;">NO DATA YET — RUN THE SCRAPER</div>',
            unsafe_allow_html=True
        )
        return

    st.caption(f"{len(df):,} records")

    event = st.dataframe(
        df,
        use_container_width=True,
        height=400,
        on_select="rerun",
        selection_mode="multi-row",
        key=f"{dl_key}_table"
    )

    selected_rows = getattr(getattr(event, "selection", None), "rows", [])
    if selected_rows:
        if st.button(f"🗑️ Delete {len(selected_rows)} Selected", key=f"{dl_key}_delete_btn", type="primary"):
            from config.settings import DATA_DIR
            from storage.csv_store import overwrite_csv
            df_remaining = df.drop(df.index[selected_rows])
            filepath = DATA_DIR / f"{filename_base}.csv"
            overwrite_csv(filepath, pd.DataFrame(df_remaining))
            st.rerun()

    col1, col2 = st.columns(2)
    with col1:
        st.download_button(
            label="⬇️ Download CSV",
            data=df.to_csv(index=False),
            file_name=f"{filename_base}.csv",
            mime="text/csv",
            key=f"{dl_key}_csv",
            use_container_width=True,
        )
    with col2:
        st.download_button(
            label="📊 Download Excel",
            data=_to_excel_bytes(df),
            file_name=f"{filename_base}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            key=f"{dl_key}_xlsx",
            use_container_width=True,
        )

def refresh_all_tabs() -> None:
    with tab_alltime:
        _render_alltime_tab()
    with tab_valid:
        _render_table(load_valid_leads(),    "valid_leads",            "dl_valid")
    with tab_rejected:
        _render_table(load_rejected_leads(), "rejected_leads",         "dl_rejected")
    with tab_existing:
        _render_table(load_existing_leads(), "already_existing_leads", "dl_existing")
    with tab_logs:
        _render_table(load_run_logs(),       "run_logs",               "dl_logs")

def _render_alltime_tab() -> None:
    df = load_all_time_unique_leads()

    col1, col2, col3 = st.columns(3)
    col1.metric("🏢 Unique Businesses", len(df))
    col2.metric("📧 With Email", int(df["email"].astype(bool).sum()) if not df.empty else 0)
    col3.metric("📞 With Phone", int(df["phone"].astype(bool).sum()) if not df.empty else 0)

    st.markdown("---")

    if df.empty:
        st.markdown(
            '<div style="text-align:center;padding:56px 0;color:#c7d2fe;font-size:13px;font-weight:600;letter-spacing:2px;">NO LEADS YET — RUN THE SCRAPER</div>',
            unsafe_allow_html=True
        )
        return

    search = st.text_input("🔍 Filter", placeholder="Search by name, email, city…", key="alltime_search")
    if search:
        mask = df.apply(lambda row: row.astype(str).str.contains(search, case=False, na=False).any(), axis=1)
        df = df[mask]
        st.caption(f"{len(df):,} results for '{search}'")
    else:
        st.caption(f"{len(df):,} unique businesses across all runs")

    event = st.dataframe(
        df,
        use_container_width=True,
        height=480,
        on_select="rerun",
        selection_mode="multi-row",
        key="alltime_table"
    )

    selected_rows = getattr(getattr(event, "selection", None), "rows", [])
    if selected_rows:
        if st.button(f"🗑️ Delete {len(selected_rows)} Selected", key="alltime_delete_btn", type="primary"):
            from config.settings import VALID_LEADS_FILE
            from storage.csv_store import load_valid_leads, overwrite_csv
            to_delete = df.iloc[selected_rows]
            valid_df = load_valid_leads()
            if not valid_df.empty:
                for _, row in to_delete.iterrows():
                    name  = str(row.get("business_name", ""))
                    phone = str(row.get("phone", ""))
                    mask  = (valid_df["business_name"] == name) & (valid_df["phone"] == phone)
                    valid_df = valid_df[~mask]
                overwrite_csv(VALID_LEADS_FILE, pd.DataFrame(valid_df))
                st.rerun()

    col1, col2 = st.columns(2)
    with col1:
        st.download_button(
            label="⬇️ Download CSV",
            data=df.to_csv(index=False),
            file_name="all_time_unique_leads.csv",
            mime="text/csv",
            key="dl_alltime_csv",
            use_container_width=True,
        )
    with col2:
        st.download_button(
            label="📊 Download Excel",
            data=_to_excel_bytes(df),
            file_name="all_time_unique_leads.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            key="dl_alltime_xlsx",
            use_container_width=True,
        )

def update_live_metrics(page: int, valid: int, rejected: int, existing: int) -> None:
    with metrics_row.container():
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("📄 PAGE",     page)
        c2.metric("✅ VALID",    valid)
        c3.metric("❌ REJECTED", rejected)
        c4.metric("🔄 EXISTING", existing)

# ── Execution ─────────────────────────────────────────────────────────────────
if start_btn:
    errors = []
    if not business_type.strip():
        errors.append("Business type is required.")
    if not zip_code.strip():
        errors.append("ZIP code is required.")
    if errors:
        for err in errors:
            st.sidebar.error(err)
    else:
        pb = progress_bar.progress(0, text="Initialising…")
        update_live_metrics(0, 0, 0, 0)

        for status in run_scraper(business_type.strip(), zip_code.strip(), int(required_leads)):
            if status["done"]:
                status_box.success(status["status_msg"])
            else:
                status_box.info(status["status_msg"])

            update_live_metrics(
                status["page"],
                status["valid_count"],
                status["rejected_count"],
                status["existing_count"],
            )

            pct = min(int(status["valid_count"] / int(required_leads) * 100), 100) if required_leads > 0 else 0
            pb.progress(pct, text=f"{pct}% complete")

            if status["done"]:
                pb.progress(100, text="✅ Complete!")
                break

        st.cache_data.clear()
        refresh_all_tabs()
else:
    st.cache_data.clear()
    refresh_all_tabs()