CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  paid integer NOT NULL CHECK (paid > 0),
  card_paid integer NOT NULL CHECK (card_paid >= 0),
  credit_paid integer NOT NULL CHECK (credit_paid >= 0),
  CHECK (card_paid + credit_paid = paid)
);

CREATE TABLE IF NOT EXISTS refunds (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id),
  amount integer NOT NULL CHECK (amount > 0),
  card_amount integer NOT NULL CHECK (card_amount >= 0),
  credit_amount integer NOT NULL CHECK (credit_amount >= 0),
  status text NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PARTIALLY_REFUNDED')),
  idempotency_key text NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (card_amount + credit_amount = amount)
);

INSERT INTO orders (id, paid, card_paid, credit_paid)
VALUES ('order-refund-demo', 12000, 9000, 3000)
ON CONFLICT (id) DO NOTHING;
