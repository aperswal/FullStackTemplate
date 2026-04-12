package main

import (
	"database/sql"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/lib/pq"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("worker starting")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Println("WARN: DATABASE_URL not set, running without database connection")
	}

	var db *sql.DB
	if dbURL != "" {
		var err error
		db, err = sql.Open("postgres", dbURL)
		if err != nil {
			log.Fatalf("failed to open database: %v", err)
		}
		defer db.Close()

		if err := db.Ping(); err != nil {
			log.Fatalf("failed to ping database: %v", err)
		}
		log.Println("database connection established")
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	log.Println("worker ready, heartbeat every 30s")

	for {
		select {
		case <-ticker.C:
			if db != nil {
				if err := db.Ping(); err != nil {
					log.Printf("heartbeat: database ping failed: %v", err)
				} else {
					log.Println("heartbeat: ok")
				}
			} else {
				log.Println("heartbeat: ok (no database)")
			}
			// TODO: Add queue consumer polling here
			// TODO: Add cron job execution here

		case sig := <-stop:
			log.Printf("received %s, shutting down gracefully", sig)
			return
		}
	}
}
