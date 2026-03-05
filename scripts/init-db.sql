-- Stars Law College — DB Initialization
-- Creates the receipt number sequence used by the API

CREATE SEQUENCE IF NOT EXISTS receipt_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;
