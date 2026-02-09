\restrict dbmate

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg13+2)
-- Dumped by pg_dump version 18.1

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
-- Name: friend_mapping_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.friend_mapping_status AS ENUM (
    'pending',
    'accepted',
    'rejected'
);


--
-- Name: gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.gender AS ENUM (
    'male',
    'female'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    id uuid DEFAULT uuidv7() NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(100) NOT NULL,
    dial_code character varying(100) NOT NULL
);


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.files (
    id uuid DEFAULT uuidv7() NOT NULL,
    key text NOT NULL,
    size bigint NOT NULL,
    _status character varying(100) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    mimetype character varying(200),
    url text
);


--
-- Name: friend_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friend_mappings (
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    status public.friend_mapping_status DEFAULT 'pending'::public.friend_mapping_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tokens (
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    meta_data jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: user_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_posts (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    file_id uuid NOT NULL,
    meta_data jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT uuidv7() NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    full_name character varying(255) GENERATED ALWAYS AS ((((first_name)::text || ' '::text) || (last_name)::text)) STORED,
    email character varying(255) NOT NULL,
    is_email_verified boolean DEFAULT false NOT NULL,
    phone_number character varying(100),
    is_phone_number_verified boolean DEFAULT false NOT NULL,
    password_hash text NOT NULL,
    profile_image_id uuid,
    gender public.gender DEFAULT 'male'::public.gender NOT NULL,
    date_of_birth date,
    country_id uuid,
    bio text,
    interested_activity character varying(200),
    is_profile_completed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    meta_data jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: countries pk_countries_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT pk_countries_id PRIMARY KEY (id);


--
-- Name: files pk_files_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT pk_files_id PRIMARY KEY (id);


--
-- Name: tokens pk_tokens_token; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT pk_tokens_token PRIMARY KEY (token);


--
-- Name: user_posts pk_user_posts_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_posts
    ADD CONSTRAINT pk_user_posts_id PRIMARY KEY (id);


--
-- Name: users pk_users_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT pk_users_id PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: countries uk_countries_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT uk_countries_code UNIQUE (code);


--
-- Name: countries uk_countries_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT uk_countries_name UNIQUE (name);


--
-- Name: files uk_files_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT uk_files_key UNIQUE (key);


--
-- Name: user_posts uk_user_posts_file_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_posts
    ADD CONSTRAINT uk_user_posts_file_id UNIQUE (file_id);


--
-- Name: users uk_users_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_users_email UNIQUE (email);


--
-- Name: friend_mappings fk_friend_mappings_receiver_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_mappings
    ADD CONSTRAINT fk_friend_mappings_receiver_id FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: friend_mappings fk_friend_mappings_sender_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_mappings
    ADD CONSTRAINT fk_friend_mappings_sender_id FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: user_posts fk_user_posts_file_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_posts
    ADD CONSTRAINT fk_user_posts_file_id FOREIGN KEY (file_id) REFERENCES public.files(id);


--
-- Name: user_posts fk_user_posts_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_posts
    ADD CONSTRAINT fk_user_posts_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users fk_users_country_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_country_id FOREIGN KEY (country_id) REFERENCES public.countries(id);


--
-- Name: users fk_users_profile_image_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_profile_image_id FOREIGN KEY (profile_image_id) REFERENCES public.files(id);


--
-- PostgreSQL database dump complete
--

\unrestrict dbmate


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20260125090150'),
    ('20260125112430'),
    ('20260126083840'),
    ('20260129093241'),
    ('20260204045620'),
    ('20260204055056'),
    ('20260204055738'),
    ('20260209083741');
