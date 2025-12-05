


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."QuestionCategory" AS ENUM (
    'COMMON',
    'dev',
    'SPECIAL'
);


ALTER TYPE "public"."QuestionCategory" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."badge" (
    "badge_id" integer NOT NULL,
    "question_id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" character varying(255)
);


ALTER TABLE "public"."badge" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."badge_badge_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."badge_badge_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."badge_badge_id_seq" OWNED BY "public"."badge"."badge_id";



CREATE TABLE IF NOT EXISTS "public"."concern" (
    "concern_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "dev_group_id" integer NOT NULL,
    "title" character varying(255) NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "was_good" boolean
);


ALTER TABLE "public"."concern" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."concern_answer" (
    "concern_answer_id" integer NOT NULL,
    "concern_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "is_accepted" boolean
);


ALTER TABLE "public"."concern_answer" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."concern_answer_concern_answer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."concern_answer_concern_answer_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."concern_answer_concern_answer_id_seq" OWNED BY "public"."concern_answer"."concern_answer_id";



CREATE SEQUENCE IF NOT EXISTS "public"."concern_concern_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."concern_concern_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."concern_concern_id_seq" OWNED BY "public"."concern"."concern_id";



CREATE TABLE IF NOT EXISTS "public"."daily_answer" (
    "daily_answer_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "question_id" integer NOT NULL,
    "answer_date" "date" NOT NULL,
    "answer_value" numeric(10,2) NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."daily_answer" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."daily_answer_daily_answer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."daily_answer_daily_answer_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."daily_answer_daily_answer_id_seq" OWNED BY "public"."daily_answer"."daily_answer_id";



CREATE TABLE IF NOT EXISTS "public"."daily_score" (
    "user_id" integer NOT NULL,
    "score_date" "date" NOT NULL,
    "cpu_score" numeric(10,2) NOT NULL
);


ALTER TABLE "public"."daily_score" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dev_group" (
    "dev_group_id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" character varying(255)
);


ALTER TABLE "public"."dev_group" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."dev_group_dev_group_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dev_group_dev_group_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dev_group_dev_group_id_seq" OWNED BY "public"."dev_group"."dev_group_id";



CREATE TABLE IF NOT EXISTS "public"."hot_developer" (
    "dev_group_id" integer NOT NULL,
    "effective_date" "date" NOT NULL,
    "user_id" integer NOT NULL
);


ALTER TABLE "public"."hot_developer" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meme" (
    "meme_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "title" character varying(255),
    "content_text" "text",
    "image_url" character varying(255),
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "like_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."meme" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meme_like" (
    "meme_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "liked_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."meme_like" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."meme_meme_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."meme_meme_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."meme_meme_id_seq" OWNED BY "public"."meme"."meme_id";



CREATE TABLE IF NOT EXISTS "public"."question" (
    "question_id" integer NOT NULL,
    "content" character varying(255) NOT NULL,
    "category" "public"."QuestionCategory" NOT NULL,
    "dev_group_id" integer,
    "weight_percent" numeric(5,2) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."question" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."question_question_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."question_question_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."question_question_id_seq" OWNED BY "public"."question"."question_id";



CREATE TABLE IF NOT EXISTS "public"."question_weight_log" (
    "weight_log_id" integer NOT NULL,
    "question_id" integer NOT NULL,
    "old_weight_percent" numeric(5,2) NOT NULL,
    "new_weight_percent" numeric(5,2) NOT NULL,
    "changed_by_root" integer NOT NULL,
    "changed_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reason" character varying(255)
);


ALTER TABLE "public"."question_weight_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."question_weight_log_weight_log_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."question_weight_log_weight_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."question_weight_log_weight_log_id_seq" OWNED BY "public"."question_weight_log"."weight_log_id";



CREATE TABLE IF NOT EXISTS "public"."role" (
    "role_id" integer NOT NULL,
    "name" character varying(255) NOT NULL
);


ALTER TABLE "public"."role" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."role_role_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."role_role_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."role_role_id_seq" OWNED BY "public"."role"."role_id";



CREATE TABLE IF NOT EXISTS "public"."user_badge" (
    "user_id" integer NOT NULL,
    "badge_id" integer NOT NULL,
    "granted_date" "date" DEFAULT CURRENT_DATE NOT NULL
);


ALTER TABLE "public"."user_badge" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_daily_like" (
    "user_id" integer NOT NULL,
    "like_date" "date" NOT NULL,
    "like_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."user_daily_like" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "user_id" integer NOT NULL,
    "nickname" character varying(255) NOT NULL,
    "password" character varying(255) NOT NULL,
    "dev_group_id" integer NOT NULL,
    "role_id" integer NOT NULL,
    "joined_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "total_answers" integer DEFAULT 0 NOT NULL,
    "total_accepted" integer DEFAULT 0 NOT NULL,
    "hot_dev_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."users_user_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."users_user_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."users_user_id_seq" OWNED BY "public"."users"."user_id";



ALTER TABLE ONLY "public"."badge" ALTER COLUMN "badge_id" SET DEFAULT "nextval"('"public"."badge_badge_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."concern" ALTER COLUMN "concern_id" SET DEFAULT "nextval"('"public"."concern_concern_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."concern_answer" ALTER COLUMN "concern_answer_id" SET DEFAULT "nextval"('"public"."concern_answer_concern_answer_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."daily_answer" ALTER COLUMN "daily_answer_id" SET DEFAULT "nextval"('"public"."daily_answer_daily_answer_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."dev_group" ALTER COLUMN "dev_group_id" SET DEFAULT "nextval"('"public"."dev_group_dev_group_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."meme" ALTER COLUMN "meme_id" SET DEFAULT "nextval"('"public"."meme_meme_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."question" ALTER COLUMN "question_id" SET DEFAULT "nextval"('"public"."question_question_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."question_weight_log" ALTER COLUMN "weight_log_id" SET DEFAULT "nextval"('"public"."question_weight_log_weight_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."role" ALTER COLUMN "role_id" SET DEFAULT "nextval"('"public"."role_role_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."users" ALTER COLUMN "user_id" SET DEFAULT "nextval"('"public"."users_user_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."badge"
    ADD CONSTRAINT "badge_pkey" PRIMARY KEY ("badge_id");



ALTER TABLE ONLY "public"."concern_answer"
    ADD CONSTRAINT "concern_answer_pkey" PRIMARY KEY ("concern_answer_id");



ALTER TABLE ONLY "public"."concern"
    ADD CONSTRAINT "concern_pkey" PRIMARY KEY ("concern_id");



ALTER TABLE ONLY "public"."daily_answer"
    ADD CONSTRAINT "daily_answer_pkey" PRIMARY KEY ("daily_answer_id");



ALTER TABLE ONLY "public"."daily_answer"
    ADD CONSTRAINT "daily_answer_user_id_question_id_answer_date_key" UNIQUE ("user_id", "question_id", "answer_date");



ALTER TABLE ONLY "public"."daily_score"
    ADD CONSTRAINT "daily_score_pkey" PRIMARY KEY ("user_id", "score_date");



ALTER TABLE ONLY "public"."dev_group"
    ADD CONSTRAINT "dev_group_pkey" PRIMARY KEY ("dev_group_id");



ALTER TABLE ONLY "public"."hot_developer"
    ADD CONSTRAINT "hot_developer_pkey" PRIMARY KEY ("dev_group_id", "effective_date");



ALTER TABLE ONLY "public"."meme_like"
    ADD CONSTRAINT "meme_like_pkey" PRIMARY KEY ("meme_id", "user_id");



ALTER TABLE ONLY "public"."meme"
    ADD CONSTRAINT "meme_pkey" PRIMARY KEY ("meme_id");



ALTER TABLE ONLY "public"."question"
    ADD CONSTRAINT "question_pkey" PRIMARY KEY ("question_id");



ALTER TABLE ONLY "public"."question_weight_log"
    ADD CONSTRAINT "question_weight_log_pkey" PRIMARY KEY ("weight_log_id");



ALTER TABLE ONLY "public"."role"
    ADD CONSTRAINT "role_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."role"
    ADD CONSTRAINT "role_pkey" PRIMARY KEY ("role_id");



ALTER TABLE ONLY "public"."user_badge"
    ADD CONSTRAINT "user_badge_pkey" PRIMARY KEY ("user_id", "badge_id", "granted_date");



ALTER TABLE ONLY "public"."user_daily_like"
    ADD CONSTRAINT "user_daily_like_pkey" PRIMARY KEY ("user_id", "like_date");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_nickname_key" UNIQUE ("nickname");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "concern_created_at_idx" ON "public"."concern" USING "btree" ("created_at" DESC);



CREATE INDEX "daily_answer_answer_date_idx" ON "public"."daily_answer" USING "btree" ("answer_date");



CREATE INDEX "daily_answer_question_id_answer_date_idx" ON "public"."daily_answer" USING "btree" ("question_id", "answer_date");



CREATE INDEX "daily_answer_user_id_answer_date_idx" ON "public"."daily_answer" USING "btree" ("user_id", "answer_date");



CREATE INDEX "daily_score_score_date_cpu_score_idx" ON "public"."daily_score" USING "btree" ("score_date", "cpu_score" DESC);



CREATE INDEX "daily_score_score_date_idx" ON "public"."daily_score" USING "btree" ("score_date");



CREATE INDEX "meme_created_at_idx" ON "public"."meme" USING "btree" ("created_at" DESC);



CREATE INDEX "question_category_dev_group_id_idx" ON "public"."question" USING "btree" ("category", "dev_group_id");



CREATE INDEX "question_category_idx" ON "public"."question" USING "btree" ("category");



CREATE INDEX "user_badge_granted_date_idx" ON "public"."user_badge" USING "btree" ("granted_date");



CREATE INDEX "user_badge_user_id_granted_date_idx" ON "public"."user_badge" USING "btree" ("user_id", "granted_date");



ALTER TABLE ONLY "public"."badge"
    ADD CONSTRAINT "badge_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."question"("question_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."concern_answer"
    ADD CONSTRAINT "concern_answer_concern_id_fkey" FOREIGN KEY ("concern_id") REFERENCES "public"."concern"("concern_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."concern_answer"
    ADD CONSTRAINT "concern_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."concern"
    ADD CONSTRAINT "concern_dev_group_id_fkey" FOREIGN KEY ("dev_group_id") REFERENCES "public"."dev_group"("dev_group_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."concern"
    ADD CONSTRAINT "concern_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."daily_answer"
    ADD CONSTRAINT "daily_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."question"("question_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."daily_answer"
    ADD CONSTRAINT "daily_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."daily_score"
    ADD CONSTRAINT "daily_score_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."hot_developer"
    ADD CONSTRAINT "hot_developer_dev_group_id_fkey" FOREIGN KEY ("dev_group_id") REFERENCES "public"."dev_group"("dev_group_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."hot_developer"
    ADD CONSTRAINT "hot_developer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."meme_like"
    ADD CONSTRAINT "meme_like_meme_id_fkey" FOREIGN KEY ("meme_id") REFERENCES "public"."meme"("meme_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."meme_like"
    ADD CONSTRAINT "meme_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."meme"
    ADD CONSTRAINT "meme_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."question"
    ADD CONSTRAINT "question_dev_group_id_fkey" FOREIGN KEY ("dev_group_id") REFERENCES "public"."dev_group"("dev_group_id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."question_weight_log"
    ADD CONSTRAINT "question_weight_log_changed_by_root_fkey" FOREIGN KEY ("changed_by_root") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."question_weight_log"
    ADD CONSTRAINT "question_weight_log_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."question"("question_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_badge"
    ADD CONSTRAINT "user_badge_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badge"("badge_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_badge"
    ADD CONSTRAINT "user_badge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_daily_like"
    ADD CONSTRAINT "user_daily_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_dev_group_id_fkey" FOREIGN KEY ("dev_group_id") REFERENCES "public"."dev_group"("dev_group_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("role_id") ON UPDATE CASCADE ON DELETE RESTRICT;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;







































































































































































































