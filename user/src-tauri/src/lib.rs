use tauri::Manager;
use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let sidecar = app
                .shell()
                .sidecar("my-sidecar")
                .expect("failed to create sidecar")
                .env("MONGODB_URI", "mongodb+srv://themishal:9gPaCroE3PMGd0rb@cluster0.irfvlsi.mongodb.net/OBD?appName=Cluster0")
                .env("NODE_ENV", "development")
                .env("CLIENT_URL", "http://localhost:3000")
                .env("JWT_ACCESS_SECRET", "dev_access_secret_change_in_production_32")
                .env("JWT_REFRESH_SECRET", "dev_refresh_secret_change_in_production_32")
                .env("JWT_ACCESS_EXPIRES_IN", "15m")
                .env("JWT_REFRESH_EXPIRES_IN", "7d");

            let (mut rx, _child) = sidecar
                .spawn()
                .expect("failed to spawn backend");

            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    println!("[backend] {:?}", event);
                }
            });

             let main_window = app.get_webview_window("main").unwrap();

            // 3. Create a thread that pings Express until it answers
            std::thread::spawn(move || {
                let client = reqwest::blocking::Client::new();
                let health_url = "http://localhost:5000"; // change to your express port
                
                let mut attempts = 0;
                while attempts < 20 {
                    // Try connecting to Express
                    if let Ok(res) = client.get(health_url).send() {
                        if res.status().is_success() {
                            break; // Express is up! Break out of loop
                        }
                    }
                    // Wait 250ms before trying again
                    std::thread::sleep(std::time::Duration::from_millis(250));
                    attempts += 1;
                }

                // 4. Express is alive, safely show the Next.js frontend now!
                main_window.show().unwrap();
            });

            Ok(())
        })
        // .run(tauri::generate_context!())
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match event {
            // This monitors window events globally outside of setup
            tauri::RunEvent::WindowEvent { label, event: tauri::WindowEvent::Destroyed, .. } => {
                if label == "main" {
                    // Forcefully terminate the application and its sidecars
                    std::process::exit(0);
                }
            }
            _ => {}
        });
}