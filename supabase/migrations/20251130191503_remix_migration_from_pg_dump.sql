CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    balance numeric(12,2) DEFAULT 0 NOT NULL,
    institution text,
    mer numeric(5,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT accounts_type_check CHECK ((type = ANY (ARRAY['checking'::text, 'savings'::text, 'tfsa'::text, 'rrsp'::text, 'brokerage'::text, 'other'::text])))
);


--
-- Name: bills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'credit_card'::text NOT NULL,
    last_four_digits text,
    due_day integer NOT NULL,
    amount numeric,
    next_due_date date NOT NULL,
    reminder_sent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: credit_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    balance numeric(12,2) DEFAULT 0 NOT NULL,
    credit_limit numeric(12,2) NOT NULL,
    due_date date,
    billing_cycle integer DEFAULT 21,
    cashback_rate numeric(5,2) DEFAULT 0,
    today_spent numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: discrepancies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discrepancies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    severity text DEFAULT 'low'::text NOT NULL,
    title text NOT NULL,
    description text,
    question text,
    resolved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT discrepancies_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT discrepancies_type_check CHECK ((type = ANY (ARRAY['cashback'::text, 'mer'::text, 'payment'::text, 'subscription'::text, 'other'::text])))
);


--
-- Name: goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    target_amount numeric(12,2) NOT NULL,
    current_amount numeric(12,2) DEFAULT 0 NOT NULL,
    target_date date,
    priority text DEFAULT 'medium'::text,
    icon text DEFAULT '🎯'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT goals_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))
);


--
-- Name: loans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    balance numeric(12,2) DEFAULT 0 NOT NULL,
    interest_rate numeric(5,2) NOT NULL,
    monthly_payment numeric(12,2) NOT NULL,
    due_date date,
    lender text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loans_type_check CHECK ((type = ANY (ARRAY['car'::text, 'mortgage'::text, 'personal'::text, 'student'::text, 'other'::text, 'loc'::text, 'line_of_credit'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    display_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: recurring_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    amount numeric NOT NULL,
    frequency text NOT NULL,
    next_date date NOT NULL,
    account_id uuid,
    type text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT recurring_transactions_frequency_check CHECK ((frequency = ANY (ARRAY['weekly'::text, 'biweekly'::text, 'monthly'::text, 'yearly'::text]))),
    CONSTRAINT recurring_transactions_type_check CHECK ((type = ANY (ARRAY['income'::text, 'expense'::text])))
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    cost numeric(10,2) NOT NULL,
    billing_cycle text NOT NULL,
    due_date date,
    category text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subscriptions_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['weekly'::text, 'monthly'::text, 'yearly'::text])))
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    category text NOT NULL,
    merchant text NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    card_id uuid,
    account_id uuid,
    source text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: weekly_advice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weekly_advice (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    action text,
    impact text,
    applied boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: bills bills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_pkey PRIMARY KEY (id);


--
-- Name: credit_cards credit_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_cards
    ADD CONSTRAINT credit_cards_pkey PRIMARY KEY (id);


--
-- Name: discrepancies discrepancies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discrepancies
    ADD CONSTRAINT discrepancies_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: loans loans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: recurring_transactions recurring_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT recurring_transactions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: weekly_advice weekly_advice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_advice
    ADD CONSTRAINT weekly_advice_pkey PRIMARY KEY (id);


--
-- Name: accounts update_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bills update_bills_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: credit_cards update_credit_cards_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON public.credit_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: goals update_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: loans update_loans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: recurring_transactions update_recurring_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_recurring_transactions_updated_at BEFORE UPDATE ON public.recurring_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: accounts accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: credit_cards credit_cards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_cards
    ADD CONSTRAINT credit_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: discrepancies discrepancies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discrepancies
    ADD CONSTRAINT discrepancies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: goals goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: loans loans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: recurring_transactions recurring_transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT recurring_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.credit_cards(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: weekly_advice weekly_advice_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_advice
    ADD CONSTRAINT weekly_advice_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: recurring_transactions Users can create their own recurring transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own recurring transactions" ON public.recurring_transactions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: accounts Users can delete their own accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own accounts" ON public.accounts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: weekly_advice Users can delete their own advice; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own advice" ON public.weekly_advice FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: bills Users can delete their own bills; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own bills" ON public.bills FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: credit_cards Users can delete their own cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own cards" ON public.credit_cards FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: discrepancies Users can delete their own discrepancies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own discrepancies" ON public.discrepancies FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: goals Users can delete their own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own goals" ON public.goals FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: loans Users can delete their own loans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own loans" ON public.loans FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: recurring_transactions Users can delete their own recurring transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own recurring transactions" ON public.recurring_transactions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can delete their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own subscriptions" ON public.subscriptions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: transactions Users can delete their own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: accounts Users can insert their own accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own accounts" ON public.accounts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: weekly_advice Users can insert their own advice; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own advice" ON public.weekly_advice FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: bills Users can insert their own bills; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own bills" ON public.bills FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: credit_cards Users can insert their own cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own cards" ON public.credit_cards FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: discrepancies Users can insert their own discrepancies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own discrepancies" ON public.discrepancies FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: goals Users can insert their own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own goals" ON public.goals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: loans Users can insert their own loans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own loans" ON public.loans FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: subscriptions Users can insert their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: transactions Users can insert their own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: accounts Users can update their own accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own accounts" ON public.accounts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: weekly_advice Users can update their own advice; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own advice" ON public.weekly_advice FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: bills Users can update their own bills; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own bills" ON public.bills FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: credit_cards Users can update their own cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own cards" ON public.credit_cards FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: discrepancies Users can update their own discrepancies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own discrepancies" ON public.discrepancies FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: goals Users can update their own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own goals" ON public.goals FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: loans Users can update their own loans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own loans" ON public.loans FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: recurring_transactions Users can update their own recurring transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own recurring transactions" ON public.recurring_transactions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can update their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: transactions Users can update their own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: accounts Users can view their own accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own accounts" ON public.accounts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: weekly_advice Users can view their own advice; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own advice" ON public.weekly_advice FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: bills Users can view their own bills; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own bills" ON public.bills FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: credit_cards Users can view their own cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own cards" ON public.credit_cards FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: discrepancies Users can view their own discrepancies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own discrepancies" ON public.discrepancies FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: goals Users can view their own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own goals" ON public.goals FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: loans Users can view their own loans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own loans" ON public.loans FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: recurring_transactions Users can view their own recurring transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own recurring transactions" ON public.recurring_transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can view their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: transactions Users can view their own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: bills; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

--
-- Name: credit_cards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

--
-- Name: discrepancies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.discrepancies ENABLE ROW LEVEL SECURITY;

--
-- Name: goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

--
-- Name: loans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: recurring_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: weekly_advice; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weekly_advice ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


