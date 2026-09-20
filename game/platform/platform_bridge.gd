class_name PlatformBridge
extends Node

enum Host { LOCAL, TELEGRAM, DISCORD }

var host := Host.LOCAL
var initialized := false

func detect_host() -> Host:
	if not OS.has_feature("web"):
		host = Host.LOCAL
		return host

	var query_host := str(JavaScriptBridge.eval("(new URLSearchParams(window.location.search)).get('platform') || ''"))
	if query_host == "telegram":
		host = Host.TELEGRAM
		return host
	if query_host == "discord":
		host = Host.DISCORD
		return host

	var telegram := _eval_bool("typeof window !== 'undefined' && !!window.Telegram && !!window.Telegram.WebApp")
	if telegram:
		host = Host.TELEGRAM
		return host

	host = Host.LOCAL
	return host

func initialize() -> void:
	host = detect_host()
	initialized = true
	if host != Host.LOCAL:
		_post_host_message("ready")

func set_fullscreen() -> void:
	if host == Host.TELEGRAM:
		_post_host_message("expand")
	elif host == Host.DISCORD:
		_post_host_message("fullscreen")

func haptic_light() -> void:
	if host == Host.TELEGRAM or host == Host.DISCORD:
		_post_host_message("haptic", {"style": "light"})
	elif OS.has_feature("mobile"):
		Input.vibrate_handheld(15)

func host_name() -> String:
	match host:
		Host.TELEGRAM:
			return "Telegram Mini App"
		Host.DISCORD:
			return "Discord Activity"
		_:
			return "Local"

func _post_host_message(action: String, payload: Dictionary = {}) -> void:
	if not OS.has_feature("web"):
		return
	var data := payload.duplicate()
	data["type"] = "baseball-waifus-host"
	data["action"] = action
	var json := JSON.stringify(data)
	JavaScriptBridge.eval("window.parent.postMessage(" + json + ", '*');")

func _eval_bool(expression: String) -> bool:
	if not OS.has_feature("web"):
		return false
	return bool(JavaScriptBridge.eval(expression))

