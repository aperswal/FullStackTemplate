package main

import (
	"database/sql"
	"database/sql/driver"
)

// fakeDriver is a minimal sql.Driver for testing heartbeat success paths.
type fakeDriver struct{}

type fakeConn struct{}

func (d fakeDriver) Open(_ string) (driver.Conn, error) {
	return fakeConn{}, nil
}

func (c fakeConn) Prepare(_ string) (driver.Stmt, error) {
	return nil, nil
}

func (c fakeConn) Close() error {
	return nil
}

func (c fakeConn) Begin() (driver.Tx, error) {
	return nil, nil
}

func (c fakeConn) Ping() error {
	return nil
}

func init() {
	sql.Register("fakedb", fakeDriver{})
}
