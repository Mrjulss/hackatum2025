from datetime import datetime
from typing import Literal, Union, cast, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import SecretStr
from app.models.chat import ChatResponse
from app.models.project_description import ProjectDescription, ProjectDescriptionWrapper
from app.models.session import ChatMessage as SessionChatMessage
from app.core.config import settings
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from app.services.prompt_service import get_project_idea_prompt


llm = ChatOpenAI(
    model="anthropic/claude-haiku-4-5",
    api_key=SecretStr(settings.REQUESTY_API_KEY),
    base_url=settings.REQUESTY_BASE_URL,
)

agent = create_agent(
    model=llm,
    system_prompt=get_project_idea_prompt(),
    response_format=ProjectDescriptionWrapper,
) # type: ignore


class ChatService:
    """Service for handling chat logic."""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.collection = self.db.sessions
    
    async def process_message(self, session_id: str, content: str) -> ChatResponse:
        """
        Process a chat message and return appropriate response.
        
        Args:
            session_id: The session ID to store messages in
            content: The user's message content
            
        Returns:
            ChatResponse with code, message, and session_id
        """
        try:
            now = datetime.utcnow().isoformat()
            
            # Create user message
            user_message = SessionChatMessage(
                role="user",
                content=content,
                timestamp=now
            )
            
            # Store user message in session
            await self.collection.update_one(
                {"session_id": session_id},
                {
                    "$push": {"chat_messages": user_message.model_dump()},
                    "$set": {"updated_at": now}
                }
            )

            # Get messages from session
            session_doc = await self.collection.find_one({"session_id": session_id}, {"chat_messages": 1})
            
            # Transform MongoDB messages to LangChain message format
            langchain_messages: list[BaseMessage] = []
            if session_doc and "chat_messages" in session_doc:
                for msg in session_doc["chat_messages"]:
                    if msg["role"] == "user":
                        langchain_messages.append(HumanMessage(content=msg["content"]))
                    elif msg["role"] == "assistant":
                        langchain_messages.append(AIMessage(content=msg["content"]))
            
            print(f"🔍 DEBUG: Invoking agent with {len(langchain_messages)} messages")
            response = await agent.ainvoke({"messages": cast(Any, langchain_messages)})
            print(f"🔍 DEBUG: Agent response: {response}")

            llm_response = response.get("structured_response")
            if llm_response is None:
                print("ERROR: No structured output from LLM")
                raise ValueError("No structured output from LLM")
            else:
                return await self.handle_llm_response(llm_response, session_id)

        except Exception as e:
            print(f"❌ ERROR in process_message: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


    async def handle_llm_response(self, llm_response: ProjectDescriptionWrapper, session_id: str):
        """
        Handle the three possible response modes:
        1. Message only -> Continue gathering info (refine)
        2. Both message + projectDescription -> Show proposal for review (refine)
        3. ProjectDescription only -> Final confirmation (finish)
        """
        update_doc: dict[str, Any]
        response_code: Literal["refine", "finish"]
        message: str
        
        has_message = llm_response.message and len(llm_response.message) > 0
        has_project_desc = llm_response.projectDescription is not None
        
        if has_message and has_project_desc:
            # MODE 2: Proposing extraction - show both message and store draft
            print("📝 MODE 2: Proposing extraction with draft project description")
            assistant_message = SessionChatMessage(
                role="assistant",
                content=llm_response.message,
                timestamp=datetime.utcnow().isoformat()
            )
            update_doc = {
                "$push": {"chat_messages": assistant_message.model_dump()},
                "$set": {
                    "updated_at": datetime.utcnow().isoformat(),
                    "project_description": llm_response.projectDescription.model_dump()
                }
            }
            response_code = "finish"
            message = llm_response.message
            
        elif has_message:
            # MODE 1: Gathering info - continue conversation
            print("💬 MODE 1: Gathering information")
            assistant_message = SessionChatMessage(
                role="assistant",
                content=llm_response.message,
                timestamp=datetime.utcnow().isoformat()
            )
            update_doc = {
                "$push": {"chat_messages": assistant_message.model_dump()},
                "$set": {"updated_at": datetime.utcnow().isoformat()}
            }
            response_code = "refine"
            message = llm_response.message
            
        elif has_project_desc:
            # MODE 3: Final confirmation - save as final
            print("✅ MODE 3: Final confirmation")
            update_doc = {
                "$set": {
                    "project_description": llm_response.projectDescription.model_dump(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
            response_code = "finish"
            message = "Perfekt! Ich verstehe jetzt dein Projekt und kann dir helfen, die beste Förderung zu finden."
            
        else:
            # Should not happen, but handle gracefully
            print("⚠️ WARNING: LLM returned empty response")
            raise ValueError("LLM returned neither message nor projectDescription")

        await self.collection.update_one(
            {"session_id": session_id},
            update_doc
        )
        
        return ChatResponse(
            session_id=session_id,
            code=response_code,
            message=message
        )



