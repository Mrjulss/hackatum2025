#%%
import duckdb
import pandas as pd
import os

# Define the directory where the individual state DBs are stored
OUTPUT_DIR = "data"
MASTER_DB_PATH = os.path.join(OUTPUT_DIR, "foundations_master.duckdb")


def create_master_db():
    """
    Combines all individual state DuckDB files into a single master DuckDB file.
    """
    if not os.path.exists(OUTPUT_DIR):
        print(f"❌ Error: Output directory '{OUTPUT_DIR}' not found.")
        return

    # Initialize the master database connection
    master_con = duckdb.connect(MASTER_DB_PATH)

    # Create the foundations table in the master DB if it doesn't exist
    master_con.execute("""
        CREATE TABLE IF NOT EXISTS foundations (
            id INTEGER, -- ID from original state DB, will be re-indexed in master
            bundesland VARCHAR,
            name VARCHAR,
            short_desc VARCHAR,
            portrait VARCHAR,
            themen VARCHAR,
            zusatzinfo VARCHAR,
            contact_info VARCHAR,
            full_html VARCHAR,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Get a list of all individual state DuckDB files
    state_db_files = [f for f in os.listdir(OUTPUT_DIR) if f.startswith("foundations_") and f.endswith(".duckdb")]

    if not state_db_files:
        print(f"No individual state database files found in '{OUTPUT_DIR}'.")
        master_con.close()
        return

    print(f"Found {len(state_db_files)} state database files. Combining into master DB...")

    for db_file in state_db_files:
        state_db_path = os.path.join(OUTPUT_DIR, db_file)
        try:
            # Attach each state database to the master database connection
            master_con.execute(f"ATTACH '{state_db_path}' AS state_db;")
            
            # Insert data from the attached state database into the master table
            # We select all columns except the 'id' from the source, as we will re-index
            master_con.execute("""
                INSERT INTO foundations (bundesland, name, short_desc, portrait, themen, zusatzinfo, contact_info, full_html, scraped_at)
                SELECT bundesland, name, short_desc, portrait, themen, zusatzinfo, contact_info, full_html, scraped_at
                FROM state_db.main.foundations;
            """)
            print(f"✅ Successfully imported data from {db_file}")
            master_con.execute(f"DETACH state_db;") # Detach after use
        except Exception as e:
            print(f"❌ Error importing data from {db_file}: {e}")
            # Ensure detachment even if an error occurs during insertion
            try:
                master_con.execute(f"DETACH state_db;")
            except Exception as detach_e:
                print(f"❌ Error detaching state_db for {db_file}: {detach_e}")

    # Re-index the master table to have a continuous primary key
    print("Re-indexing master table...")
    master_con.execute("CREATE TABLE foundations_new AS SELECT ROW_NUMBER() OVER () AS id, * EXCLUDE (id) FROM foundations;")
    master_con.execute("DROP TABLE foundations;")
    master_con.execute("ALTER TABLE foundations_new RENAME TO foundations;")
    master_con.execute("ALTER TABLE foundations ADD PRIMARY KEY (id);")
    print("✅ Master table re-indexed with new primary key.")

    master_con.close()
    print(f"🎉 Master database created at {MASTER_DB_PATH}")

if __name__ == "__main__":
    create_master_db()
# %%
