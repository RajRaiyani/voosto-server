\restrict dbmate

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
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
    'female',
    'other'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid DEFAULT uuidv7() NOT NULL,
    description text NOT NULL,
    category character varying(100),
    latitude double precision,
    longitude double precision,
    date date,
    "time" time without time zone,
    conversation_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    updated_at timestamp with time zone
);


--
-- Name: conversation_joining_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_joining_requests (
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    notification_enabled boolean DEFAULT true NOT NULL
);


--
-- Name: conversation_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_members (
    conversation_id uuid CONSTRAINT conversation_participants_conversation_id_not_null NOT NULL,
    user_id uuid CONSTRAINT conversation_participants_user_id_not_null NOT NULL,
    joined_at timestamp with time zone DEFAULT now() CONSTRAINT conversation_participants_joined_at_not_null NOT NULL,
    is_admin boolean DEFAULT false CONSTRAINT conversation_participants_is_admin_not_null NOT NULL,
    notification_enabled boolean DEFAULT true NOT NULL
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT uuidv7() NOT NULL,
    name character varying(255),
    is_group boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    is_womans_only boolean DEFAULT false NOT NULL,
    display_picture_id uuid,
    is_deletable boolean DEFAULT true NOT NULL,
    meta_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    place_id character varying(255),
    place_name character varying(255)
);


--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    id uuid DEFAULT uuidv7() NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(100) NOT NULL,
    dial_code character varying(100) NOT NULL,
    flag character varying(5)
);


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.files (
    id uuid DEFAULT uuidv7() NOT NULL,
    key text NOT NULL,
    _status character varying(100) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    endpoint text DEFAULT 'http://localhost:3007/files'::text NOT NULL,
    url text GENERATED ALWAYS AS (((endpoint || '/'::text) || key)) STORED
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
-- Name: message_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_attachments (
    message_id uuid NOT NULL,
    file_id uuid NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT uuidv7() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    seen_at timestamp with time zone
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT uuidv7() NOT NULL,
    type character varying(100) DEFAULT 'general'::character varying NOT NULL,
    user_id uuid NOT NULL,
    meta_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    title text DEFAULT ''::text NOT NULL
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
-- Name: trips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trips (
    id uuid DEFAULT uuidv7() NOT NULL,
    conversation_id uuid,
    date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    updated_at timestamp with time zone,
    place_id character varying(255) NOT NULL,
    place_name character varying(255) NOT NULL,
    meta_data jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: user_notification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_notification_tokens (
    token text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
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
    password_hash text,
    profile_image_id uuid,
    gender public.gender DEFAULT 'male'::public.gender NOT NULL,
    date_of_birth date,
    country_id uuid,
    bio text,
    interested_activity character varying(200),
    is_profile_completed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    meta_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    login_method character varying(100) DEFAULT 'normal'::character varying NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL
);


--
-- Name: visited_countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visited_countries (
    user_id uuid NOT NULL,
    country_id uuid NOT NULL
);


--
-- Name: activities pk_activities_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT pk_activities_id PRIMARY KEY (id);


--
-- Name: conversation_joining_requests pk_c_joining_requests_conversation_id_user_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_joining_requests
    ADD CONSTRAINT pk_c_joining_requests_conversation_id_user_id PRIMARY KEY (conversation_id, user_id);


--
-- Name: conversation_members pk_conversation_participants_conversation_id_user_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT pk_conversation_participants_conversation_id_user_id PRIMARY KEY (conversation_id, user_id);


--
-- Name: conversations pk_conversations_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT pk_conversations_id PRIMARY KEY (id);


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
-- Name: message_attachments pk_message_attachments_message_id_file_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT pk_message_attachments_message_id_file_id PRIMARY KEY (message_id, file_id);


--
-- Name: messages pk_messages_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT pk_messages_id PRIMARY KEY (id);


--
-- Name: notifications pk_notifications_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT pk_notifications_id PRIMARY KEY (id);


--
-- Name: tokens pk_tokens_token; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT pk_tokens_token PRIMARY KEY (token);


--
-- Name: trips pk_trips_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT pk_trips_id PRIMARY KEY (id);


--
-- Name: user_notification_tokens pk_user_notification_tokens_user_id_token; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_tokens
    ADD CONSTRAINT pk_user_notification_tokens_user_id_token PRIMARY KEY (user_id, token);


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
-- Name: visited_countries pk_visited_countries_user_id_country_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visited_countries
    ADD CONSTRAINT pk_visited_countries_user_id_country_id PRIMARY KEY (user_id, country_id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: conversations uk_conversations_place_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT uk_conversations_place_id UNIQUE (place_id);


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
-- Name: trips uk_trips_created_by_place_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT uk_trips_created_by_place_id UNIQUE (created_by, place_id);


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
-- Name: activities fk_activities_conversation_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT fk_activities_conversation_id FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);


--
-- Name: activities fk_activities_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT fk_activities_created_by FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: conversation_joining_requests fk_conversation_joining_requests_conversation_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_joining_requests
    ADD CONSTRAINT fk_conversation_joining_requests_conversation_id FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_joining_requests fk_conversation_joining_requests_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_joining_requests
    ADD CONSTRAINT fk_conversation_joining_requests_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversation_members fk_conversation_participants_conversation_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT fk_conversation_participants_conversation_id FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);


--
-- Name: conversation_members fk_conversation_participants_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT fk_conversation_participants_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: conversations fk_conversations_display_picture_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT fk_conversations_display_picture_id FOREIGN KEY (display_picture_id) REFERENCES public.files(id);


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
-- Name: message_attachments fk_message_attachments_file_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT fk_message_attachments_file_id FOREIGN KEY (file_id) REFERENCES public.files(id);


--
-- Name: message_attachments fk_message_attachments_message_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT fk_message_attachments_message_id FOREIGN KEY (message_id) REFERENCES public.messages(id);


--
-- Name: messages fk_messages_conversation_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_messages_conversation_id FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);


--
-- Name: messages fk_messages_sender_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_messages_sender_id FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: notifications fk_notifications_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: trips fk_trips_conversation_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT fk_trips_conversation_id FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);


--
-- Name: trips fk_trips_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT fk_trips_created_by FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: user_notification_tokens fk_user_notification_tokens_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_tokens
    ADD CONSTRAINT fk_user_notification_tokens_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


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
-- Name: visited_countries fk_visited_countries_country_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visited_countries
    ADD CONSTRAINT fk_visited_countries_country_id FOREIGN KEY (country_id) REFERENCES public.countries(id);


--
-- Name: visited_countries fk_visited_countries_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visited_countries
    ADD CONSTRAINT fk_visited_countries_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


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
    ('20260209083741'),
    ('20260210065048'),
    ('20260211060551'),
    ('20260211065012'),
    ('20260211110548'),
    ('20260212173852'),
    ('20260213070435'),
    ('20260215084528'),
    ('20260219105456'),
    ('20260220084853'),
    ('20260220123759'),
    ('20260223092714'),
    ('20260223093211'),
    ('20260223161037'),
    ('20260223163035'),
    ('20260223171157'),
    ('20260225051531'),
    ('20260226140218'),
    ('20260226143146'),
    ('20260227133125'),
    ('20260228124828'),
    ('20260302130220'),
    ('20260302131301');
