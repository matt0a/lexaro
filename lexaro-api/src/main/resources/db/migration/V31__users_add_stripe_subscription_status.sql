alter table users
    add column if not exists stripe_subscription_status varchar(50);
