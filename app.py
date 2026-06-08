import streamlit as st
import pandas as pd

from scraper_engine import run_scraper
from storage.csv_store import (
    load_valid_leads,
    load_rejected_leads,
    load_existing_leads,
    load_run_logs,
    load_all_time_unique_leads,
    clear_all_data,
)

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title = "Lead Scraper Pro",
    page_icon  = "🎯",
    layout     = "wide",
)

# ── Sidebar ───────────────────────────────────────────────────────────────────
st.sidebar.title("🎯 Lead Scraper Pro")
st.sidebar.markdown("---")

business_type  = st.sidebar.text_input("Business Type", placeholder="e.g. pizza shops")
zip_code       = st.sidebar.text_input("ZIP Code",      placeholder="e.g. 45001")
required_leads = st.sidebar.number_input(
    "Required Leads", min_value=1, max_value=500, value=20, step=5
)
st.sidebar.markdown("---")
start_btn = st.sidebar.button("🚀 Start Scraper", type="primary", use_container_width=True)

st.sidebar.markdown("---")
delete_btn = st.sidebar.button("🗑️ Delete All Leads", use_container_width=True)
if delete_btn:
    clear_all_data()
    st.rerun()

# ── Main header ───────────────────────────────────────────────────────────────
st.title("🎯 Lead Scraper Dashboard")

# ── Live feedback placeholders (replaced on each generator yield) ─────────────
status_box   = st.empty()
progress_bar = st.empty()
metrics_row  = st.empty()

# ── Result tabs (defined once; content injected by render functions) ──────────
tab_valid, tab_rejected, tab_existing, tab_logs, tab_alltime = st.tabs([
    "✅ Valid Leads",
    "❌ Rejected Leads",
    "🔄 Already Existing",
    "📋 Run Logs",
    "🌟 All Time Unique Leads",
])


# ── Helper functions ──────────────────────────────────────────────────────────

import io

def _to_excel_bytes(df: pd.DataFrame) -> bytes:
    """Convert a DataFrame to Excel bytes for download."""
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Leads")
    return buffer.getvalue()

def _render_table(df: pd.DataFrame, filename_base: str, dl_key: str) -> None:
    """Display a DataFrame with CSV and Excel download buttons side by side."""
    if df.empty:
        st.info("No data yet. Run the scraper to populate this table.")
        return

    st.caption(f"{len(df):,} records")
    
    event = st.dataframe(
        df, 
        use_container_width=True, 
        height=420,
        on_select="rerun",
        selection_mode="multi-row",
        key=f"{dl_key}_table"
    )
    
    selected_rows = event.selection.rows
    if selected_rows:
        if st.button(f"🗑️ Delete {len(selected_rows)} Selected Row(s)", key=f"{dl_key}_delete_btn", type="primary"):
            from config.settings import DATA_DIR
            from storage.csv_store import overwrite_csv
            
            df_remaining = df.drop(df.index[selected_rows])
            filepath = DATA_DIR / f"{filename_base}.csv"
            overwrite_csv(filepath, df_remaining)
            st.rerun()

    col1, col2 = st.columns(2)

    with col1:
        st.download_button(
            label     = "⬇️ Download CSV",
            data      = df.to_csv(index=False),
            file_name = f"{filename_base}.csv",
            mime      = "text/csv",
            key       = f"{dl_key}_csv",
            use_container_width=True,
        )

    with col2:
        st.download_button(
            label     = "📊 Download Excel",
            data      = _to_excel_bytes(df),
            file_name = f"{filename_base}.xlsx",
            mime      = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            key       = f"{dl_key}_xlsx",
            use_container_width=True,
        )


def refresh_all_tabs() -> None:
    """Reload every CSV and render into its tab."""
    with tab_valid:
        _render_table(load_valid_leads(),    "valid_leads",            "dl_valid")
    with tab_rejected:
        _render_table(load_rejected_leads(), "rejected_leads",         "dl_rejected")
    with tab_existing:
        _render_table(load_existing_leads(), "already_existing_leads", "dl_existing")
    with tab_logs:
        _render_table(load_run_logs(),       "run_logs",               "dl_logs")
    with tab_alltime:
        _render_alltime_tab()

def _render_alltime_tab() -> None:
    df = load_all_time_unique_leads()
    
    # Header stats row
    col1, col2, col3 = st.columns(3)
    col1.metric("🏢 Total Unique Businesses", len(df))
    col2.metric("📧 With Email", int(df["email"].astype(bool).sum()) if not df.empty else 0)
    col3.metric("📞 With Phone", int(df["phone"].astype(bool).sum()) if not df.empty else 0)
    
    st.markdown("---")
    
    if df.empty:
        st.info("No leads yet. Run the scraper to populate.")
        return
    
    # Search/filter box
    search = st.text_input(
        "🔍 Filter leads", 
        placeholder="Search by name, email, city...",
        key="alltime_search"
    )
    if search:
        mask = df.apply(
            lambda row: row.astype(str).str.contains(
                search, case=False, na=False
            ).any(), axis=1
        )
        df = df[mask]
        st.caption(f"{len(df):,} results matching '{search}'")
    else:
        st.caption(f"{len(df):,} unique businesses across all runs")
    
    event = st.dataframe(
        df, 
        use_container_width=True, 
        height=500,
        on_select="rerun",
        selection_mode="multi-row",
        key="alltime_table"
    )
    
    selected_rows = event.selection.rows
    if selected_rows:
        if st.button(f"🗑️ Delete {len(selected_rows)} Selected Row(s)", key="alltime_delete_btn", type="primary"):
            from config.settings import VALID_LEADS_FILE
            from storage.csv_store import load_valid_leads, overwrite_csv
            
            to_delete = df.iloc[selected_rows]
            valid_df = load_valid_leads()
            
            if not valid_df.empty:
                # Remove rows matching the selected business names and phones
                for _, row in to_delete.iterrows():
                    name = str(row.get("business_name", ""))
                    phone = str(row.get("phone", ""))
                    mask = (valid_df["business_name"] == name) & (valid_df["phone"] == phone)
                    valid_df = valid_df[~mask]
                
                overwrite_csv(VALID_LEADS_FILE, valid_df)
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
    """Overwrite the metrics placeholder with fresh values."""
    with metrics_row.container():
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("📄 Page",      page)
        c2.metric("✅ Valid",     valid)
        c3.metric("❌ Rejected",  rejected)
        c4.metric("🔄 Existing",  existing)


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
        # Initialise live widgets
        pb = progress_bar.progress(0, text="Starting…")
        update_live_metrics(0, 0, 0, 0)

        for status in run_scraper(
            business_type.strip(),
            zip_code.strip(),
            int(required_leads),
        ):
            # Update status message
            if status["done"]:
                status_box.success(status["status_msg"])
            else:
                status_box.info(status["status_msg"])

            # Update metrics block
            update_live_metrics(
                status["page"],
                status["valid_count"],
                status["rejected_count"],
                status["existing_count"],
            )

            # Update progress bar
            pct = min(
                int(status["valid_count"] / int(required_leads) * 100), 100
            ) if required_leads > 0 else 0
            pb.progress(pct, text=f"{pct}% complete")

            if status["done"]:
                pb.progress(100, text="✅ Complete!")
                break

        # Reload all tabs with fresh data after run
        refresh_all_tabs()

else:
    # On initial load, display whatever data already exists on disk
    refresh_all_tabs()