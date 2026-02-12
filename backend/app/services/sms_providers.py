from twilio.rest import Client


async def send_sms_via_provider(provider: str, config: dict, to: str, body: str):
    return send_via_twilio(config, to, body)


#Not working
def send_via_twilio(config: dict, to: str, body: str):
    client = Client(config["account_sid"], config["auth_token"])
    message = client.messages.create(
        body=body,
        from_=config["from_number"],
        to=to,
    )
    return message.sid
